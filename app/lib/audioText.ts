// Words of ours for the player (Phase 4B), in a file with no imports so a page, a test or a script can use them without pulling in the data.
/** Shown when a file cannot be played. Nothing here claims the audio works offline. */
export const PLAY_ERROR = "Couldn’t play. Audio needs a connection unless it was downloaded.";
export const TIMEOUT_ERROR = "Taking too long to start. Check your connection and try again.";
export const BLOCKED_NOTE = "Tap Play to start.";
/** An ayah (in a queue or alone) that could not be played, after the automatic second try. */
export const ayahFailedMessage = (surah: number, ayah: number): string => `Couldn’t play ayah ${surah}:${ayah}. Audio needs a connection unless it was downloaded.`;
export const SKIP_AYAH = "Skip this ayah";
/** The sheet's switch (Phase 4C): off by default, never on while Reduce motion is on. */
export const FOLLOW_LABEL = "Follow audio";
export const FOLLOW_DESC = "Keep the playing ayah in view";
export const FOLLOW_REDUCED_NOTE = "Off while Reduce motion is on in Settings.";
/** The Asma-ul-Husna names whose recording does not exist at the audio source today. */
export const NO_RECORDING = "No recording for this name";
export const RECITER_RESTART_NOTE = "Switching reciter restarts this surah.";
export const RESUME_LABEL = "Resume where you stopped";
/** The note above the reciter chips, before anything happens: what a switch does for the thing that is playing. */
export const reciterNote = (kind: "surah" | "ayah" | "queue" | "clip"): string =>
  kind === "queue" ? "Switching reciter plays this ayah again and carries on." : kind === "ayah" ? "Switching reciter plays this ayah again." : RECITER_RESTART_NOTE;
