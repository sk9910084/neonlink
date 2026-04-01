# ⚡ NeonLink — URL Shortener

A **free, serverless URL shortener** built with HTML, CSS, and JavaScript. Uses GitHub as the backend (JSON storage) and deploys on **GitHub Pages** with zero server cost.

---

## ✨ Features

- 🔗 **Shorten any URL** with random or custom IDs
- ⏱️ **5-second countdown** redirect page with ad support
- 📋 **Admin panel** with password protection
- 📊 **Click tracking** per link
- 🔲 **QR code generator** for each link
- ⬆️ **Push to GitHub** via API — updates `links.json` directly
- 📱 **Fully mobile responsive** dark neon UI
- 💾 **localStorage** for instant offline access
- 🆓 **Zero cost** — GitHub Pages + GitHub API

---

## 🚀 Quick Deploy (5 minutes)

### Step 1 — Fork / Create Repo

1. Create a new GitHub repository (e.g. `neonlink`)
2. Upload all these files to the **root** of the repo:
   - `index.html`
   - `redirect.html`
   - `admin.html`
   - `style.css`
   - `app.js`
   - `config.js`
   - `links.json`
   - `README.md`

### Step 2 — Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select `main` branch, root folder `/`
3. Click **Save**
4. Your site will be at: `https://YOUR_USERNAME.github.io/neonlink/`

### Step 3 — Configure `config.js`

Edit `config.js` and set:

```js
var GITHUB_OWNER = "your-github-username";
var GITHUB_REPO  = "neonlink";
var ADMIN_PASSWORD = "your-secure-password";
var SITE_BASE_URL = "https://your-username.github.io/neonlink/";
```

### Step 4 — Get a GitHub Token (for admin push)

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Check the **`repo`** scope
4. Copy the token
5. In the Admin Panel → GitHub Configuration, enter your token

> ⚠️ **Never commit your token** to the repo. Only enter it in the Admin Panel.

---

## 📁 File Structure

```
neonlink/
├── index.html      ← Homepage (shorten URLs)
├── redirect.html   ← Countdown + redirect page
├── admin.html      ← Admin panel (password protected)
├── style.css       ← All styles (dark neon theme)
├── app.js          ← Core logic (shared)
├── config.js       ← Your configuration
├── links.json      ← Link database
└── README.md       ← This file
```

---

## 📱 Android App (WebView)

A simple Android Studio project is included in `android-app/`. It loads your GitHub Pages URL in a WebView with:
- Splash screen
- Internet connectivity check
- Back navigation support

**To use:**
1. Open `android-app/` in Android Studio
2. Edit `MainActivity.java` → change `SITE_URL` to your GitHub Pages URL
3. Build APK → `Build > Build Bundle(s)/APK(s) > Build APK(s)`

---

## 💰 Monetization (Adsterra / Monetag)

In `redirect.html`, find this comment:

```html
<!-- ===== ADSTERRA / MONETAG AD CODE HERE ===== -->
```

Paste your ad script there. The 5-second countdown keeps users on the page long enough to see the ad.

---

## 🔐 Security Notes

- The admin password is in `config.js` (JS, visible to browser)
- This is suitable for **personal use** — not for public multi-user platforms
- GitHub token is never stored in the repo — only entered at runtime in Admin Panel
- For production, consider using GitHub Actions secrets or a proper backend

---

## 🛠 How the Storage Works

| Action | Where |
|--------|-------|
| Create link | Saved to `localStorage` instantly |
| Load links | Loads from `localStorage` + syncs from `links.json` on GitHub |
| Push to GitHub | Admin clicks "Push to GitHub" → GitHub API updates `links.json` |
| Click tracking | Increments counter in `localStorage`, persists on next push |

---

## 📄 License

MIT — Free to use, modify, and distribute.

---

Made with ⚡ by NeonLink
