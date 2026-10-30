// What the browser says about the connection. Only Chrome on Android reports the connection type, so "Wi-Fi only" can be honoured only there
// (Settings greys the switch elsewhere with the reason). Nothing here guesses: an unknown type is never treated as mobile data.
export interface NavLike {
  onLine?: boolean;
  connection?: { type?: string };
}
export interface Net {
  online: boolean;
  /** The browser says this is mobile data. */
  cellular: boolean;
}
export const readNet = (nav: NavLike | undefined): Net => ({ online: nav?.onLine !== false, cellular: nav?.connection?.type === "cellular" });
/** Whether this browser reports the connection type at all. */
export const connectionKnown = (nav: NavLike | undefined): boolean => typeof nav?.connection?.type === "string";
