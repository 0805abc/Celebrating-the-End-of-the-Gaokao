/**
 * 开场弹窗 · 作者信息解码与完整性校验（浏览器端展示）
 */
window.INTRO_GUARD = (function () {
  'use strict';

  const _k = [103, 107, 45, 105, 110, 116, 114, 111, 45, 118, 49, 45, 48, 56, 48, 53, 97, 98, 99]
    .map(c => String.fromCharCode(c)).join('');

  function decodeBlob(blob) {
    const bin = atob(blob);
    const bytes = new Uint8Array(bin.length);
    const key = new TextEncoder().encode(_k);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i) ^ key[i % key.length];
    }
    return new TextDecoder().decode(bytes);
  }

  function bytesToHex(bytes) {
    return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* 纯 JS SHA-256 — file:// 或非 HTTPS 时 crypto.subtle 不可用 */
  function sha256Fallback(bytes) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const rotr = (n, x) => (x >>> n) | (x << (32 - n));
    const ch = (x, y, z) => (x & y) ^ (~x & z);
    const maj = (x, y, z) => (x & y) ^ (x & z) ^ (y & z);
    const sigma0 = x => rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
    const sigma1 = x => rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
    const g0 = x => rotr(7, x) ^ rotr(18, x) ^ (x >>> 3);
    const g1 = x => rotr(17, x) ^ rotr(19, x) ^ (x >>> 10);

    const len = bytes.length;
    const bitLen = len * 8;
    const padLen = ((len + 9 + 63) & ~63);
    const buf = new Uint8Array(padLen);
    buf.set(bytes);
    buf[len] = 0x80;
    const view = new DataView(buf.buffer);
    view.setUint32(padLen - 4, bitLen, false);

    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    const w = new Uint32Array(64);

    for (let off = 0; off < padLen; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false);
      for (let i = 16; i < 64; i++) w[i] = (g1(w[i - 2]) + w[i - 7] + g0(w[i - 15]) + w[i - 16]) >>> 0;
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + sigma1(e) + ch(e, f, g) + K[i] + w[i]) >>> 0;
        const t2 = (sigma0(a) + maj(a, b, c)) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }
    const out = new Uint8Array(32);
    const dv = new DataView(out.buffer);
    dv.setUint32(0, h0, false); dv.setUint32(4, h1, false);
    dv.setUint32(8, h2, false); dv.setUint32(12, h3, false);
    dv.setUint32(16, h4, false); dv.setUint32(20, h5, false);
    dv.setUint32(24, h6, false); dv.setUint32(28, h7, false);
    return bytesToHex(out);
  }

  async function sha256Hex(text) {
    const bytes = new TextEncoder().encode(text);
    if (window.isSecureContext && crypto.subtle?.digest) {
      try {
        const buf = await crypto.subtle.digest('SHA-256', bytes);
        return bytesToHex(new Uint8Array(buf));
      } catch (_) {}
    }
    return sha256Fallback(bytes);
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function render(mount, p) {
    mount.innerHTML = `
      <p class="modal-title" id="introPromptTitle">${esc(p.title)}</p>
      <p class="intro-author">Author: ${esc(p.author)}</p>
      <a class="intro-github-btn" href="${esc(p.github)}" target="_blank" rel="noopener noreferrer">${esc(p.githubBtn)}</a>
      <details class="intro-license">
        <summary>${esc(p.licenseSummary)}</summary>
        <pre class="intro-license-text">${esc(p.license)}</pre>
      </details>
      <p class="intro-copyright"><span class="intro-copyright-mark" aria-label="版权">©</span> ${esc(p.copyrightYear)} ${esc(p.copyrightHolder)}</p>`;
  }

  async function mountProtected(target) {
    const pack = window.INTRO_PROTECTED_DATA;
    if (!target) return false;
    if (!pack?.blob || !pack?.hash) {
      target.innerHTML = '<p class="intro-tamper">作者信息文件缺失，请确认已部署 intro-protected.js。</p>';
      return false;
    }
    try {
      const json = decodeBlob(pack.blob);
      const hash = await sha256Hex(json);
      if (hash !== pack.hash) {
        target.innerHTML = '<p class="intro-tamper">作者信息校验未通过，请使用原版文件。</p>';
        return false;
      }
      render(target, JSON.parse(json));
      return true;
    } catch (err) {
      target.innerHTML = '<p class="intro-tamper">作者信息加载失败，请刷新或检查 intro-protected.js 是否完整。</p>';
      return false;
    }
  }

  function mountPrivacy(target) {
    const cfg = window.INTRO_PRIVACY;
    if (!target || !cfg?.paragraphs?.length) return;
    target.innerHTML = cfg.paragraphs.map(t => `<p>${t}</p>`).join('');
  }

  return { mountProtected, mountPrivacy };
})();
