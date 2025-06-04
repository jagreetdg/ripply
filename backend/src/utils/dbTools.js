/**
 * Run a specific SQL migration from the schema
 * @param {string} migration - The migration to run (e.g. 'create_voice_note_shares')
 * @returns {Promise<Object>} - Result of the migration
 */
async function runMigration(migration) {
	try {
		console.log(`[DBTOOLS] Running migration: ${migration}`);

		let sql = "";

		// Define the migrations
		const migrations = {
			create_voice_note_shares: `
        -- Create voice_note_shares table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.voice_note_shares (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(voice_note_id, user_id)
        );
        
        -- Create indexes for the shares table
        CREATE INDEX IF NOT EXISTS idx_voice_note_shares_voice_note_id ON public.voice_note_shares(voice_note_id);
        CREATE INDEX IF NOT EXISTS idx_voice_note_shares_user_id ON public.voice_note_shares(user_id);
        CREATE INDEX IF NOT EXISTS idx_voice_note_shares_shared_at ON public.voice_note_shares(shared_at);
        
        -- Enable RLS for the shares table
        ALTER TABLE public.voice_note_shares ENABLE ROW LEVEL SECURITY;
        
        -- Voice note shares RLS policies
        DROP POLICY IF EXISTS "Anyone can view voice note shares" ON public.voice_note_shares;
        CREATE POLICY "Anyone can view voice note shares" ON public.voice_note_shares FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Users can insert their own voice note shares" ON public.voice_note_shares;
        CREATE POLICY "Users can insert their own voice note shares" ON public.voice_note_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can update their own voice note shares" ON public.voice_note_shares;
        CREATE POLICY "Users can update their own voice note shares" ON public.voice_note_shares FOR UPDATE USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can delete their own voice note shares" ON public.voice_note_shares;
        CREATE POLICY "Users can delete their own voice note shares" ON public.voice_note_shares FOR DELETE USING (auth.uid() = user_id);
      `,

			create_shares_function: `
        -- Function to check if a user has shared a voice note
        CREATE OR REPLACE FUNCTION public.has_user_shared_voice_note(user_uuid UUID, voice_note_uuid UUID)
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM public.voice_note_shares
            WHERE user_id = user_uuid AND voice_note_id = voice_note_uuid
          );
        END;
        $$ LANGUAGE plpgsql;
      `,

			create_shares_view: `
        -- Create or replace the voice notes with stats view to include shares
        CREATE OR REPLACE VIEW public.voice_notes_with_stats AS
        SELECT 
          vn.*,
          COUNT(DISTINCT vnl.id) AS likes_count,
          COUNT(DISTINCT vnc.id) AS comments_count,
          COUNT(DISTINCT vnp.id) AS plays_count,
          COUNT(DISTINCT vns.id) AS shares_count
        FROM 
          public.voice_notes vn
        LEFT JOIN 
          public.voice_note_likes vnl ON vn.id = vnl.voice_note_id
        LEFT JOIN 
          public.voice_note_comments vnc ON vn.id = vnc.voice_note_id
        LEFT JOIN 
          public.voice_note_plays vnp ON vn.id = vnp.voice_note_id
        LEFT JOIN 
          public.voice_note_shares vns ON vn.id = vns.voice_note_id
        GROUP BY 
          vn.id;
      `,

			create_migration_function: `
        -- Create a function to run arbitrary SQL
        CREATE OR REPLACE FUNCTION public.run_sql(sql text)
        RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Create a function to create the voice_note_shares table if it doesn't exist
        CREATE OR REPLACE FUNCTION public.create_voice_note_shares_table_if_not_exists()
        RETURNS void AS $$
        BEGIN
          CREATE TABLE IF NOT EXISTS public.voice_note_shares (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(voice_note_id, user_id)
          );
          
          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_voice_note_shares_voice_note_id ON public.voice_note_shares(voice_note_id);
          CREATE INDEX IF NOT EXISTS idx_voice_note_shares_user_id ON public.voice_note_shares(user_id);
          CREATE INDEX IF NOT EXISTS idx_voice_note_shares_shared_at ON public.voice_note_shares(shared_at);
          
          -- Enable RLS
          ALTER TABLE public.voice_note_shares ENABLE ROW LEVEL SECURITY;
          
          -- Create RLS policies
          DROP POLICY IF EXISTS "Anyone can view voice note shares" ON public.voice_note_shares;
          CREATE POLICY "Anyone can view voice note shares" ON public.voice_note_shares FOR SELECT USING (true);
          
          DROP POLICY IF EXISTS "Users can insert their own voice note shares" ON public.voice_note_shares;
          CREATE POLICY "Users can insert their own voice note shares" ON public.voice_note_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
          
          DROP POLICY IF EXISTS "Users can update their own voice note shares" ON public.voice_note_shares;
          CREATE POLICY "Users can update their own voice note shares" ON public.voice_note_shares FOR UPDATE USING (auth.uid() = user_id);
          
          DROP POLICY IF EXISTS "Users can delete their own voice note shares" ON public.voice_note_shares;
          CREATE POLICY "Users can delete their own voice note shares" ON public.voice_note_shares FOR DELETE USING (auth.uid() = user_id);
        END;
        $$ LANGUAGE plpgsql;
      `,
		};

		// Check if the requested migration exists
		if (!migrations[migration]) {
			return {
				success: false,
				error: `Migration '${migration}' not found`,
			};
		}

		// Get the SQL for the migration
		sql = migrations[migration];

		// Execute the SQL via RPC if available
		try {
			const { error } = await supabase.rpc("run_sql", { sql });

			if (error) {
				console.error(
					`[DBTOOLS] Error running migration '${migration}' via RPC:`,
					error
				);
				return { success: false, error: error.message };
			}

			return {
				success: true,
				message: `Migration '${migration}' executed successfully`,
			};
		} catch (rpcError) {
			// RPC may fail if the function doesn't exist, try direct SQL
			console.error(
				`[DBTOOLS] RPC error for migration '${migration}':`,
				rpcError
			);
			console.log(
				`[DBTOOLS] Falling back to direct SQL for migration '${migration}'`
			);

			try {
				// For direct SQL, we can't use simple queries for DDL statements
				// This is just for showing the approach - in production we would need a better solution
				console.warn(
					`[DBTOOLS] Direct SQL execution not implemented for migration '${migration}'`
				);
				return {
					success: false,
					error: "Direct SQL execution not implemented",
				};
			} catch (sqlError) {
				console.error(
					`[DBTOOLS] SQL error for migration '${migration}':`,
					sqlError
				);
				return { success: false, error: sqlError.message };
			}
		}
	} catch (error) {
		console.error(
			`[DBTOOLS] Unexpected error running migration '${migration}':`,
			error
		);
		return { success: false, error: error.message };
	}
}

module.exports = {
	checkVoiceSharesTableExists,
	createVoiceSharesTable,
	getVoiceSharesTableStructure,
	getVoiceSharesCount,
	runDatabaseHealthCheck,
	runMigration,
};
