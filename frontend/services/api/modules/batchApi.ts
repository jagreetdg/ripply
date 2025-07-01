import { checkLikeStatus } from "./voiceNoteApi";
import { hasUserRepostedVoiceNote, getRepostCount } from "./repostApi";

interface BatchRequestItem {
  voiceNoteId: string;
  userId: string;
  type: 'like' | 'repost' | 'shareCount';
}

interface BatchResult {
  voiceNoteId: string;
  type: 'like' | 'repost' | 'shareCount';
  result: any;
  error?: string;
}

// Request queue and processing
class BatchRequestManager {
  private queue: BatchRequestItem[] = [];
  private processing = false;
  private readonly BATCH_SIZE = 5; // Process 5 requests at a time
  private readonly BATCH_DELAY = 100; // Wait 100ms between batches
  private callbacks: Map<string, (results: BatchResult[]) => void> = new Map();

  // Add requests to queue
  addRequests(requests: BatchRequestItem[], callback: (results: BatchResult[]) => void) {
    const batchId = `batch_${Date.now()}_${Math.random()}`;
    this.callbacks.set(batchId, callback);
    
    // Add batch ID to requests for tracking
    const requestsWithBatch = requests.map(req => ({ ...req, batchId }));
    this.queue.push(...requestsWithBatch);
    
    this.processQueue();
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const startTime = Date.now();
    
    while (this.queue.length > 0) {
      // Take a batch of requests
      const batch = this.queue.splice(0, this.BATCH_SIZE);
      const results: BatchResult[] = [];
      
      console.log(`[BATCH API] Processing batch of ${batch.length} requests (Queue size: ${this.queue.length + batch.length})`);
      
      // Process batch in parallel (but limited to BATCH_SIZE)
      const promises = batch.map(async (item: any) => {
        try {
          let result;
          
          switch (item.type) {
            case 'like':
              result = await checkLikeStatus(item.voiceNoteId, item.userId);
              break;
            case 'repost':
              result = await hasUserRepostedVoiceNote(item.voiceNoteId, item.userId);
              break;
            case 'shareCount':
              result = await getRepostCount(item.voiceNoteId);
              break;
            default:
              throw new Error(`Unknown request type: ${item.type}`);
          }
          
          return {
            voiceNoteId: item.voiceNoteId,
            type: item.type,
            result,
            batchId: item.batchId
          };
        } catch (error) {
          console.error(`[BATCH API] Error processing ${item.type} for ${item.voiceNoteId}:`, error);
          return {
            voiceNoteId: item.voiceNoteId,
            type: item.type,
            result: item.type === 'like' ? { isLiked: false } : 
                   item.type === 'repost' ? false : 0,
            error: error instanceof Error ? error.message : String(error),
            batchId: item.batchId
          };
        }
      });
      
      const batchResults = await Promise.allSettled(promises);
      
      // Group results by batch ID
      const resultsByBatch: Map<string, BatchResult[]> = new Map();
      
      batchResults.forEach((promiseResult) => {
        if (promiseResult.status === 'fulfilled') {
          const result = promiseResult.value as any;
          const batchId = result.batchId;
          
          if (!resultsByBatch.has(batchId)) {
            resultsByBatch.set(batchId, []);
          }
          
          resultsByBatch.get(batchId)!.push({
            voiceNoteId: result.voiceNoteId,
            type: result.type,
            result: result.result,
            error: result.error
          });
        }
      });
      
      // Call callbacks for completed batches
      resultsByBatch.forEach((results, batchId) => {
        const callback = this.callbacks.get(batchId);
        if (callback) {
          callback(results);
          this.callbacks.delete(batchId);
        }
      });
      
      // Wait before processing next batch
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
      }
    }
    
    const endTime = Date.now();
    console.log(`[BATCH API] Queue processing completed in ${endTime - startTime}ms`);
    this.processing = false;
  }
}

// Global batch manager instance
const batchManager = new BatchRequestManager();

// Batch API for voice note stats
export const batchVoiceNoteStats = (voiceNoteId: string, userId: string): Promise<{
  likeStatus: any;
  repostStatus: boolean;
  shareCount: number;
}> => {
  return new Promise((resolve) => {
    const requests: BatchRequestItem[] = [
      { voiceNoteId, userId, type: 'like' },
      { voiceNoteId, userId, type: 'repost' },
      { voiceNoteId, userId, type: 'shareCount' }
    ];
    
    batchManager.addRequests(requests, (results) => {
      const likeResult = results.find(r => r.type === 'like');
      const repostResult = results.find(r => r.type === 'repost');
      const shareCountResult = results.find(r => r.type === 'shareCount');
      
      resolve({
        likeStatus: likeResult?.result || { isLiked: false },
        repostStatus: repostResult?.result || false,
        shareCount: shareCountResult?.result || 0
      });
    });
  });
};

// Export the batch manager for advanced usage
export { batchManager }; 