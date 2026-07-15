/**
 * Native / WebView audio hygiene for voice (Phase 12 follow-up).
 * iOS AVAudioSession is configured in AppDelegate; here we keep the screen awake
 * while connected so Cap WebView mic sessions are less likely to suspend.
 */

let wakeLock: WakeLockSentinel | null = null;
let visibilityHandler: (() => void) | null = null;

async function requestWakeLock(): Promise<void> {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    /* permission / unsupported */
  }
}

export async function enterVoiceAudioSession(): Promise<void> {
  await requestWakeLock();
  if (typeof document === "undefined" || visibilityHandler) return;
  visibilityHandler = () => {
    if (document.visibilityState === "visible") {
      void requestWakeLock();
    }
  };
  document.addEventListener("visibilitychange", visibilityHandler);
}

export async function leaveVoiceAudioSession(): Promise<void> {
  if (visibilityHandler && typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = null;
  }
  try {
    await wakeLock?.release();
  } catch {
    /* ignore */
  }
  wakeLock = null;
}
