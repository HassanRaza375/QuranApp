// The "/" key opens Search from any page, unless the user is typing somewhere or a dialog is open. Pure over a minimal event shape.
export interface KeyLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  defaultPrevented?: boolean;
  target?: EventTarget | { tagName?: string; isContentEditable?: boolean } | null;
}

const TYPING = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** `dialogOpen`: a sheet or dialog is showing (the page behind it is not what the user is looking at). */
export function opensSearch(e: KeyLike, dialogOpen = false): boolean {
  if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || dialogOpen) return false;
  const t = e.target as { tagName?: string; isContentEditable?: boolean } | null | undefined;
  return !(t && (TYPING.has((t.tagName ?? "").toUpperCase()) || t.isContentEditable));
}
