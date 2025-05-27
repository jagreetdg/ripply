import React from "react";
import { VoiceNoteCardProps } from "./VoiceNoteCardTypes"; // Path becomes ./
import { VoiceNoteCardImpl } from "./VoiceNoteCardImpl"; // Path becomes ./

// Simple wrapper component to maintain the existing API
export function VoiceNoteCard(props: VoiceNoteCardProps) {
	return <VoiceNoteCardImpl {...props} />;
}
