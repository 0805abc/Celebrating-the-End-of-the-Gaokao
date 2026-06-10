/**
 * 微信 / QQ 内置浏览器拦截 — 引导用户复制链接到系统浏览器打开
 */
(function () {
  'use strict';

  function detectInApp(ua) {
    ua = ua || navigator.userAgent || '';
    if (/MicroMessenger/i.test(ua)) return true;
    return (
      /\bQQ\//i.test(ua) ||
      /MQQBrowser/i.test(ua) ||
      /QQClient/i.test(ua) ||
      /QBCore/i.test(ua) ||
      /V1_AND_SQ/i.test(ua) ||
      /\bQQB\//i.test(ua) ||
      /Qzone/i.test(ua) ||
      /QQTheme/i.test(ua) ||
      /QQInternational/i.test(ua) ||
      /TencentTraveler/i.test(ua)
    );
  }

  function hasQQBridge() {
    return !!(window.mqq || window.QqApi || window.qq || window.QQApi);
  }

  function applyBlock() {
    if (window.__INAPP_BLOCKED__) return;
    if (detectInApp() || hasQQBridge()) {
      window.__INAPP_BLOCKED__ = true;
      document.documentElement.classList.add('inapp-blocked');
    }
  }

  applyBlock();

  function init() {
    applyBlock();

    if (!window.__INAPP_BLOCKED__) return;

    const urlEl = document.getElementById('inappBlockUrl');
    const copyBtn = document.getElementById('inappBlockCopy');
    const tipEl = document.getElementById('inappBlockCopied');
    const href = location.href;
    if (urlEl) urlEl.textContent = href;

    if (!copyBtn) return;

    copyBtn.addEventListener('click', async () => {
      let ok = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(href);
          ok = true;
        }
      } catch (_) {}

      if (!ok) {
        const ta = document.createElement('textarea');
        ta.value = href;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, href.length);
        try { ok = document.execCommand('copy'); } catch (_) {}
        ta.remove();
      }

      if (tipEl) {
        tipEl.textContent = ok ? '已复制，请粘贴到浏览器地址栏打开' : '复制失败，请长按上方链接手动复制';
        tipEl.classList.remove('hidden');
      }
      if (ok) copyBtn.textContent = '已复制';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  setTimeout(applyBlock, 0);
})();
