import liff from '@line/liff';

/**
 * 偵測當前環境是否為一個已知有問題的內嵌 WebView (例如 Facebook, Instagram)。
 * 這些環境通常會阻擋 OAuth 登入流程。
 * @returns {boolean} 如果是已知的問題 WebView，則為 true。
 */
export function isProblematicWebView(): boolean {
  // 在 liff.init() 執行後，liff.isInClient() 是最可靠的判斷。
  // 如果我們在 LINE App 中，那它就不是「有問題」的 WebView。
  try {
    if (liff.isApiAvailable('isInClient') && liff.isInClient()) {
      return false;
    }
  } catch (e) {
    // liff.init() has not been called, proceed with UA check.
  }

  const ua = (typeof navigator !== 'undefined') ? navigator.userAgent : '';

  // 已知的 App 內建瀏覽器特徵
  const isFacebook = /FBAV|FBAN/i.test(ua);
  const isInstagram = /Instagram/i.test(ua);

  // 通用 Android WebView 特徵
  const isAndroidWV = /wv/i.test(ua);

  // 通用 iOS WebView 特徵 (User Agent 是 iPhone/iPad 但不是 Safari)
  const isIOSWebView = /(iPhone|iPod|iPad)(?!.*Safari)/i.test(ua);

  return isFacebook || isInstagram || isAndroidWV || isIOSWebView;
}

/**
 * 偵測當前環境是否為桌面瀏覽器。
 * @returns {boolean} 如果是桌面瀏覽器，則為 true。
 */
export function isDesktop(): boolean {
  const ua = (typeof navigator !== 'undefined') ? navigator.userAgent : '';
  return !/Mobi|Android|iPhone|iPad|iPod/i.test(ua);
}