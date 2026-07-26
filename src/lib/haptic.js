// 가벼운 햅틱(진동) 피드백. 웹 Vibration API 사용.
// ⚠️ Android 크롬 등에서는 동작하지만, iOS Safari는 Vibration API를
//    지원하지 않아 진동이 없다(무해하게 무시됨).
export function haptic(ms = 10) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms)
  } catch {
    /* no-op */
  }
}
