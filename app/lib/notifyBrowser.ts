// The browser side of notifications: permission and showing one. Kept small and defensive: every call can fail
// (unsupported browser, blocked, no service worker) and the Settings page must show a plain message, never `alert()`.
export type PermissionState = "unsupported" | "default" | "granted" | "denied";

export const notificationPermission = (): PermissionState => (typeof Notification === "undefined" ? "unsupported" : (Notification.permission as PermissionState));

/** Must be called from a tap. Returns the resulting state. */
export async function requestNotificationPermission(): Promise<PermissionState> {
  if (typeof Notification === "undefined") return "unsupported";
  try {
    await Notification.requestPermission();
  } catch {
    /* the state below says what happened */
  }
  return notificationPermission();
}

export interface NotificationContent {
  title: string;
  body: string;
  /** the same tag replaces an earlier notification instead of adding another (also across open tabs) */
  tag: string;
}

/** Shows a notification through the service worker (it appears in the system tray), or directly if there is no worker. */
export async function showNotificationNow(c: NotificationContent): Promise<boolean> {
  if (notificationPermission() !== "granted") return false;
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: c.body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: c.tag,
    vibrate: [200, 100, 200],
  };
  try {
    const reg = typeof navigator !== "undefined" && "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) await reg.showNotification(c.title, options);
    else new Notification(c.title, options);
    return true;
  } catch {
    return false;
  }
}

/**
 * Where a hint about the Home Screen is true: on iPhone and iPad, web notifications work only for a web app added to the
 * Home Screen (iOS and iPadOS 16.4 and later; WebKit, "Web Push for Web Apps on iOS and iPadOS"). Shown only when this
 * browser has no Notification API at all.
 */
export const needsHomeScreenHint = (): boolean => typeof Notification === "undefined" && typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
