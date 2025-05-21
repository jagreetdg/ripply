#!/bin/bash

# Find all files with imports of VoiceNoteCard
echo "Finding files with VoiceNoteCard imports..."
# Adjust grep path to search the entire frontend directory
files=$(grep -r --include="*.tsx" --include="*.ts" "import.*VoiceNoteCard" frontend/ | cut -d ':' -f 1 | sort | uniq)

# For each file, replace imports
if [ -z "$files" ]; then
  echo "No files found with VoiceNoteCard imports."
else
  echo "Updating imports in the following files:"
  for file in $files; do
    echo "  $file"
    # Update imports from the old VoiceNoteCard.tsx location (if any left)
    sed -i "" 's|import { VoiceNoteCard } from "@/components/profile/VoiceNoteCard"|import { VoiceNoteCard } from "@/components/voice-note-card/VoiceNoteCard"|g' "$file"
    sed -i "" 's|import { VoiceNoteCard } from "../../components/profile/VoiceNoteCard"|import { VoiceNoteCard } from "../../components/voice-note-card/VoiceNoteCard"|g' "$file"
    sed -i "" 's|import { VoiceNoteCard } from "../profile/VoiceNoteCard"|import { VoiceNoteCard } from "../voice-note-card/VoiceNoteCard"|g' "$file"
    # Update imports from the intermediate VoiceNoteCardNew.tsx location
    sed -i "" 's|import { VoiceNoteCard } from "@/components/profile/VoiceNoteCardNew"|import { VoiceNoteCard } from "@/components/voice-note-card/VoiceNoteCard"|g' "$file"
    sed -i "" 's|import { VoiceNoteCard } from "../../components/profile/VoiceNoteCardNew"|import { VoiceNoteCard } from "../../components/voice-note-card/VoiceNoteCard"|g' "$file"
    sed -i "" 's|import { VoiceNoteCard } from "../profile/VoiceNoteCardNew"|import { VoiceNoteCard } from "../voice-note-card/VoiceNoteCard"|g' "$file"

    # Handle cases where VoiceNoteCard might be imported from the new directory but incorrectly from profile or as VoiceNoteCardNew
    sed -i "" 's|import { VoiceNoteCard } from "@/components/voice-note-card/VoiceNoteCardNew"|import { VoiceNoteCard } from "@/components/voice-note-card/VoiceNoteCard"|g' "$file"
    sed -i "" 's|import { VoiceNoteCard } from "../voice-note-card/VoiceNoteCardNew"|import { VoiceNoteCard } from "../voice-note-card/VoiceNoteCard"|g' "$file"
    sed -i "" 's|import { VoiceNoteCard, VoiceNoteCardProps } from "../profile/VoiceNoteCardImpl"|import { VoiceNoteCard, VoiceNoteCardProps } from "../voice-note-card/VoiceNoteCard"|g' "$file"
    sed -i "" 's|import { VoiceNoteCard } from "@/components/profile/VoiceNoteCard";|import { VoiceNoteCard } from "@/components/voice-note-card/VoiceNoteCard";|g' "$file"
    sed -i "" 's|import { VoiceNoteCard } from "frontend/components/profile/VoiceNoteCard";|import { VoiceNoteCard } from "frontend/components/voice-note-card/VoiceNoteCard";|g' "$file"

  done
  echo "Import updates complete!"
fi

# Once testing is complete, we can rename the files
echo ""
echo "After testing, run these commands to finalize the changes:"
echo "  mv frontend/components/profile/VoiceNoteCardNew.tsx frontend/components/profile/VoiceNoteCard.tsx.new"
echo "  mv frontend/components/profile/VoiceNoteCard.tsx frontend/components/profile/VoiceNoteCard.tsx.bak"
echo "  mv frontend/components/profile/VoiceNoteCard.tsx.new frontend/components/profile/VoiceNoteCard.tsx" 