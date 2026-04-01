/**
 * LinkPro - GitHub JSON Database Layer
 * All data stored in GitHub repo as JSON files
 * Files: users.json, links.json, withdrawals.json, settings.json
 */

// ─── CONFIGURATION ───────────────────────────────────────────
const DB_CONFIG = {
  owner: "sk9910084",           // GitHub username
  repo:  "linkpro-db",          // Create this repo on GitHub
  token: "",                     // Set via admin panel (never hardcode)
  branch: "main",
  // Admin access URL pattern: ?admin=sk9910084
  adminKey: "sk9910084",
  adminEmail: "shahrukhkhan65761@gmail.com",
  adminPass: "sk9910084@Sk",
  // Earning rates
  perClickEarning: 0.001,        // ₹ per click
  referralBonus: 5.00,           // ₹ on referral signup
  referralClickPercent: 10,      // 10% of referee's click earnings
  minWithdrawal: 50,             // Minimum ₹50 to withdraw
  siteURL: "",                   // Auto-detected
};

// ─── CACHE ───────────────────────────────────────────────────
const _cache = { users: null, links: null, withdrawals: null, settings: null };

function getSiteURL() {
  if (DB_CONFIG.siteURL) return DB_CONFIG.siteURL;
  const l = window.location;
  return l.protocol + '//' + l.host + l.pathname.replace(/\/[^/]*$/, '/');
}

// ─── GitHub API Helpers ───────────────────────────────────────
async function ghGet(file) {
  // Try raw first (no token needed for public repos)
  try {
    const raw = `https://raw.githubusercontent.com/${DB_CONFIG.owner}/${DB_CONFIG.repo}/${DB_CONFIG.branch}/${file}?t=${Date.now()}`;
    const r = await fetch(raw);
    if (r.ok) return await r.json();
  } catch(_) {}

  // Fallback to API
  const token = DB_CONFIG.token || localStorage.getItem('lp_token') || '';
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if (token) headers.Authorization = `token ${token}`;
  const r = await fetch(`https://api.github.com/repos/${DB_CONFIG.owner}/${DB_CONFIG.repo}/contents/${file}`, { headers });
  if (!r.ok) return null;
  const d = await r.json();
  return JSON.parse(atob(d.content.replace(/\n/g, '')));
}

async function ghPut(file, data) {
  const token = DB_CONFIG.token || localStorage.getItem('lp_token') || '';
  if (!token) throw new Error('GitHub token not set. Set it in Admin → Settings.');

  const headers = { Authorization: `token ${token}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' };
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

  // Get SHA
  let sha = null;
  try {
    const r = await fetch(`https://api.github.com/repos/${DB_CONFIG.owner}/${DB_CONFIG.repo}/contents/${file}`, { headers });
    if (r.ok) { const d = await r.json(); sha = d.sha; }
  } catch(_) {}

  const body = { message: `Update ${file}`, content, branch: DB_CONFIG.branch };
  if (sha) body.sha = sha;

  const res = await fetch(`https://api.github.com/repos/${DB_CONFIG.owner}/${DB_CONFIG.repo}/contents/${file}`, {
    method: 'PUT', headers, body: JSON.stringify(body)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return true;
}

// ─── Local Storage DB (instant, synced to GitHub periodically) ──
function localGet(key) {
  try { return JSON.parse(localStorage.getItem('lp_' + key) || 'null'); } catch(_) { return null; }
}
function localSet(key, data) {
  localStorage.setItem('lp_' + key, JSON.stringify(data));
  localStorage.setItem('lp_' + key + '_dirty', '1');
}

// ─── USERS ───────────────────────────────────────────────────
async function getUsers() {
  if (_cache.users) return _cache.users;
  let data = localGet('users');
  if (!data) {
    data = await ghGet('users.json') || {};
    localSet('users', data);
  }
  _cache.users = data;
  return data;
}

async function saveUsers(users) {
  _cache.users = users;
  localSet('users', users);
  try { await ghPut('users.json', users); } catch(e) { console.warn('GitHub sync failed:', e.message); }
}

async function getUserByEmail(email) {
  const users = await getUsers();
  return Object.values(users).find(u => u.email === email.toLowerCase()) || null;
}

async function getUserById(id) {
  const users = await getUsers();
  return users[id] || null;
}

async function createUser(name, email, password, referralCode) {
  const users = await getUsers();
  // Check duplicate
  if (Object.values(users).find(u => u.email === email.toLowerCase())) {
    throw new Error('Email already registered!');
  }
  const id = 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const myReferralCode = Math.random().toString(36).substr(2, 8).toUpperCase();

  const user = {
    id, name, email: email.toLowerCase(),
    password: btoa(password), // basic obfuscation
    referralCode: myReferralCode,
    referredBy: null,
    balance: 0,
    totalEarned: 0,
    totalClicks: 0,
    totalReferrals: 0,
    totalLinks: 0,
    joinedAt: new Date().toISOString(),
    upiId: '',
    bankDetails: '',
    active: true
  };

  // Handle referral
  if (referralCode) {
    const referrer = Object.values(users).find(u => u.referralCode === referralCode.toUpperCase());
    if (referrer) {
      user.referredBy = referrer.id;
      // Credit referrer
      referrer.balance += DB_CONFIG.referralBonus;
      referrer.totalEarned += DB_CONFIG.referralBonus;
      referrer.totalReferrals = (referrer.totalReferrals || 0) + 1;
      users[referrer.id] = referrer;
    }
  }

  users[id] = user;
  await saveUsers(users);
  return user;
}

async function updateUser(id, updates) {
  const users = await getUsers();
  if (!users[id]) throw new Error('User not found');
  users[id] = { ...users[id], ...updates };
  await saveUsers(users);
  return users[id];
}

// ─── AUTH ─────────────────────────────────────────────────────
function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem('lp_user') || localStorage.getItem('lp_session') || 'null'); } catch(_) { return null; }
}

function setCurrentUser(user, remember) {
  sessionStorage.setItem('lp_user', JSON.stringify(user));
  if (remember) localStorage.setItem('lp_session', JSON.stringify(user));
}

function logout() {
  sessionStorage.removeItem('lp_user');
  localStorage.removeItem('lp_session');
}

async function loginUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user) throw new Error('Email not found. Please sign up first.');
  if (atob(user.password) !== password) throw new Error('Wrong password!');
  if (!user.active) throw new Error('Account suspended. Contact support.');
  setCurrentUser(user, true);
  return user;
}

// ─── LINKS ────────────────────────────────────────────────────
async function getLinks() {
  if (_cache.links) return _cache.links;
  let data = localGet('links');
  if (!data) {
    data = await ghGet('links.json') || {};
    localSet('links', data);
  }
  _cache.links = data;
  return data;
}

async function saveLinks(links) {
  _cache.links = links;
  localSet('links', links);
  try { await ghPut('links.json', links); } catch(e) { console.warn('GitHub sync failed:', e.message); }
}

async function createLink(userId, originalUrl, customId, title) {
  const links = await getLinks();
  const id = customId || Math.random().toString(36).substr(2, 7);
  if (links[id]) throw new Error('Short ID already taken! Try another.');
  if (!/^https?:\/\/.+/.test(originalUrl)) throw new Error('Invalid URL. Must start with http:// or https://');

  const link = {
    id, userId, title: title || originalUrl.substring(0, 50),
    originalUrl, clicks: 0,
    earning: 0,
    createdAt: new Date().toISOString(),
    active: true
  };
  links[id] = link;
  await saveLinks(links);

  // Update user link count
  const users = await getUsers();
  if (users[userId]) { users[userId].totalLinks = (users[userId].totalLinks || 0) + 1; await saveUsers(users); }
  return link;
}

async function deleteLink(linkId, userId) {
  const links = await getLinks();
  if (!links[linkId]) throw new Error('Link not found');
  if (links[linkId].userId !== userId) throw new Error('Not authorized');
  delete links[linkId];
  await saveLinks(links);
}

async function recordClick(linkId) {
  const links = localGet('links') || {};
  if (!links[linkId]) return null;

  const link = links[linkId];
  link.clicks = (link.clicks || 0) + 1;
  link.earning = (link.earning || 0) + DB_CONFIG.perClickEarning;
  links[linkId] = link;
  localSet('links', links);
  _cache.links = links;

  // Update user balance
  const users = localGet('users') || {};
  const user = users[link.userId];
  if (user) {
    user.balance = +(user.balance + DB_CONFIG.perClickEarning).toFixed(4);
    user.totalEarned = +(user.totalEarned + DB_CONFIG.perClickEarning).toFixed(4);
    user.totalClicks = (user.totalClicks || 0) + 1;

    // Referral earning
    if (user.referredBy && users[user.referredBy]) {
      const ref = users[user.referredBy];
      const refEarn = +(DB_CONFIG.perClickEarning * DB_CONFIG.referralClickPercent / 100).toFixed(6);
      ref.balance = +(ref.balance + refEarn).toFixed(4);
      ref.totalEarned = +(ref.totalEarned + refEarn).toFixed(4);
      users[user.referredBy] = ref;
    }
    users[link.userId] = user;
    localSet('users', users);
    _cache.users = users;
  }

  // Push to GitHub async
  setTimeout(async () => {
    try { await ghPut('links.json', links); await ghPut('users.json', users); } catch(_) {}
  }, 3000);

  return link;
}

// ─── WITHDRAWALS ─────────────────────────────────────────────
async function getWithdrawals() {
  let data = localGet('withdrawals');
  if (!data) { data = await ghGet('withdrawals.json') || []; localSet('withdrawals', data); }
  return data;
}

async function requestWithdrawal(userId, amount, upiId, method) {
  const users = await getUsers();
  const user = users[userId];
  if (!user) throw new Error('User not found');
  if (amount < DB_CONFIG.minWithdrawal) throw new Error(`Minimum withdrawal is ₹${DB_CONFIG.minWithdrawal}`);
  if (user.balance < amount) throw new Error('Insufficient balance!');
  if (!upiId) throw new Error('Please add UPI ID in profile first');

  // Deduct balance
  user.balance = +(user.balance - amount).toFixed(2);
  users[userId] = user;
  await saveUsers(users);

  // Create withdrawal record
  const withdrawals = await getWithdrawals();
  const wd = {
    id: 'wd_' + Date.now(),
    userId, userName: user.name, userEmail: user.email,
    amount, upiId, method: method || 'UPI',
    status: 'pending',
    requestedAt: new Date().toISOString(),
    processedAt: null
  };
  withdrawals.unshift(wd);
  localSet('withdrawals', withdrawals);
  try { await ghPut('withdrawals.json', withdrawals); } catch(_) {}
  return wd;
}

async function processWithdrawal(wdId, status) {
  const withdrawals = await getWithdrawals();
  const wd = withdrawals.find(w => w.id === wdId);
  if (!wd) throw new Error('Withdrawal not found');
  wd.status = status;
  wd.processedAt = new Date().toISOString();

  // If rejected, refund balance
  if (status === 'rejected') {
    const users = await getUsers();
    if (users[wd.userId]) {
      users[wd.userId].balance = +(users[wd.userId].balance + wd.amount).toFixed(2);
      await saveUsers(users);
    }
  }
  localSet('withdrawals', withdrawals);
  await ghPut('withdrawals.json', withdrawals);
  return wd;
}

// ─── SETTINGS ─────────────────────────────────────────────────
function getSettings() {
  const s = localGet('settings');
  return s || {
    siteName: 'LinkPro',
    perClickEarning: DB_CONFIG.perClickEarning,
    referralBonus: DB_CONFIG.referralBonus,
    referralClickPercent: DB_CONFIG.referralClickPercent,
    minWithdrawal: DB_CONFIG.minWithdrawal,
    maintenance: false
  };
}

function saveSettings(s) {
  localSet('settings', s);
  DB_CONFIG.perClickEarning = s.perClickEarning;
  DB_CONFIG.referralBonus = s.referralBonus;
  DB_CONFIG.referralClickPercent = s.referralClickPercent;
  DB_CONFIG.minWithdrawal = s.minWithdrawal;
  try { ghPut('settings.json', s); } catch(_) {}
}
