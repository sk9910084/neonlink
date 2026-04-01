/**
 * ============================================================
 *  NeonLink – Core Application Logic (app.js)
 *  Shared across index.html, redirect.html, admin.html
 * ============================================================
 */

// ─── Helpers ────────────────────────────────────────────────

function generateId(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidURL(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function getBaseURL() {
  if (SITE_BASE_URL) return SITE_BASE_URL;
  const loc = window.location;
  const path = loc.pathname.replace(/\/[^\/]*$/, '/');
  return `${loc.protocol}//${loc.host}${path}`;
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('✅ Copied to clipboard!');
  }).catch(() => {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('✅ Copied!');
  });
}

function showToast(msg, duration = 2500) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.style.cssText = `
      position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(80px);
      background:var(--glass-bg);border:1px solid var(--neon);color:var(--neon);
      padding:12px 24px;border-radius:50px;font-family:var(--font-body);font-size:0.9rem;
      z-index:9999;transition:transform 0.3s ease;backdrop-filter:blur(12px);
      box-shadow:0 0 20px rgba(0,255,135,0.3);
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => { toast.style.transform = 'translateX(-50%) translateY(80px)'; }, duration);
}

// ─── Local Storage ──────────────────────────────────────────

function getLocalLinks() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  } catch (_) {
    return {};
  }
}

function saveLocalLinks(links) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(links));
  // Update stats
  updateStats(links);
}

function updateStats(links) {
  const keys = Object.keys(links);
  let clicks = 0;
  keys.forEach(k => { const e = links[k]; clicks += (typeof e === 'object' ? (e.clicks || 0) : 0); });

  localStorage.setItem('neonlink_stats', JSON.stringify({
    total: keys.length,
    clicks: clicks
  }));
}

function recordClick(shortId) {
  const links = getLocalLinks();
  if (links[shortId]) {
    if (typeof links[shortId] === 'object') {
      links[shortId].clicks = (links[shortId].clicks || 0) + 1;
    } else {
      links[shortId] = { url: links[shortId], clicks: 1 };
    }
    saveLocalLinks(links);
  }
}

// ─── Fetch Links (from GitHub or localStorage) ─────────────

async function fetchLinks() {
  // First check localStorage
  const local = getLocalLinks();

  // Try GitHub if configured
  if (FETCH_FROM_GITHUB && GITHUB_OWNER && GITHUB_REPO && GITHUB_OWNER !== 'YOUR_GITHUB_USERNAME') {
    try {
      const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/links.json?t=${Date.now()}`;
      const res = await fetch(url);
      if (res.ok) {
        const remote = await res.json();
        // Merge remote into local (remote is source of truth, local has clicks)
        const merged = { ...remote };
        Object.keys(local).forEach(k => {
          if (!merged[k]) merged[k] = local[k];
          else if (typeof merged[k] === 'object' && typeof local[k] === 'object') {
            merged[k].clicks = Math.max(merged[k].clicks || 0, local[k].clicks || 0);
          }
        });
        saveLocalLinks(merged);
        return merged;
      }
    } catch (_) {
      // Fall back to local
    }
  }
  return local;
}

// ─── Stats ──────────────────────────────────────────────────

function loadStats() {
  try {
    const s = JSON.parse(localStorage.getItem('neonlink_stats') || '{}');
    const links = getLocalLinks();
    const total = Object.keys(links).length;
    let clicks = 0;
    Object.keys(links).forEach(k => {
      const e = links[k];
      clicks += (typeof e === 'object' ? (e.clicks || 0) : 0);
    });

    const totalEl = document.getElementById('totalLinks');
    const clickEl = document.getElementById('totalClicks');
    if (totalEl) totalEl.textContent = total;
    if (clickEl) clickEl.textContent = clicks;
  } catch (_) {}
}

// ─── Shorten URL (index.html) ────────────────────────────────

async function shortenURL() {
  const input = document.getElementById('urlInput');
  const customId = document.getElementById('customId');
  const resultBox = document.getElementById('resultBox');
  const errorBox = document.getElementById('errorBox');
  const btn = document.getElementById('shortenBtn');

  resultBox.style.display = 'none';
  errorBox.style.display = 'none';

  const url = input.value.trim();
  const rawId = customId ? customId.value.trim() : '';

  if (!url) {
    showError('Please enter a URL.');
    return;
  }
  if (!isValidURL(url)) {
    showError('Invalid URL. Make sure it starts with https:// or http://');
    return;
  }

  let shortId = rawId || generateId();

  if (rawId && !/^[a-zA-Z0-9_-]+$/.test(rawId)) {
    showError('Custom ID can only contain letters, numbers, - and _');
    return;
  }

  const links = getLocalLinks();

  if (rawId && links[rawId]) {
    showError(`ID "${rawId}" is already taken. Try a different one.`);
    return;
  }

  // Ensure uniqueness for random IDs
  while (!rawId && links[shortId]) {
    shortId = generateId();
  }

  // Save
  links[shortId] = { url, clicks: 0, created: new Date().toISOString() };
  saveLocalLinks(links);

  // Animate button
  btn.classList.add('loading');
  await new Promise(r => setTimeout(r, 400));
  btn.classList.remove('loading');

  // Show result
  const shortLink = `${getBaseURL()}redirect.html?id=${shortId}`;
  document.getElementById('resultLink').textContent = shortLink;
  resultBox.setAttribute('data-url', shortLink);
  resultBox.setAttribute('data-id', shortId);
  resultBox.style.display = 'block';

  // Clear inputs
  input.value = '';
  if (customId) customId.value = '';

  // Update stats
  loadStats();

  // Hide QR if shown
  const qrBox = document.getElementById('qrBox');
  if (qrBox) { qrBox.style.display = 'none'; qrBox.innerHTML = ''; }
}

function showError(msg) {
  const box = document.getElementById('errorBox');
  const el = document.getElementById('errorMsg');
  if (box && el) { el.textContent = '❌ ' + msg; box.style.display = 'block'; }
}

function copyLink() {
  const box = document.getElementById('resultBox');
  const url = box ? box.getAttribute('data-url') : document.getElementById('resultLink').textContent;
  copyText(url);
}

function testLink() {
  const box = document.getElementById('resultBox');
  const url = box ? box.getAttribute('data-url') : null;
  if (url) window.open(url, '_blank');
}

function showQR() {
  const box = document.getElementById('resultBox');
  const url = box ? box.getAttribute('data-url') : null;
  const qrBox = document.getElementById('qrBox');
  if (!url || !qrBox) return;

  if (qrBox.style.display === 'block') {
    qrBox.style.display = 'none';
    qrBox.innerHTML = '';
    return;
  }

  qrBox.innerHTML = '';
  qrBox.style.display = 'block';

  if (typeof QRCode !== 'undefined') {
    new QRCode(qrBox, {
      text: url,
      width: 160,
      height: 160,
      colorDark: '#00ff87',
      colorLight: '#0a0a0f',
      correctLevel: QRCode.CorrectLevel.H
    });
  } else {
    // Fallback: Google Charts API
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}&color=00ff87&bgcolor=0a0a0f`;
    img.alt = 'QR Code';
    img.style.borderRadius = '8px';
    qrBox.appendChild(img);
  }
  qrBox.insertAdjacentHTML('beforeend', `
    <p style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;">Scan to open link</p>
    <button class="btn-sm" style="margin-top:6px;" onclick="downloadQR()">⬇️ Download QR</button>
  `);
}

function downloadQR() {
  const canvas = document.querySelector('#qrBox canvas');
  if (canvas) {
    const link = document.createElement('a');
    link.download = 'neonlink-qr.png';
    link.href = canvas.toDataURL();
    link.click();
  }
}
