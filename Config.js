/**
 * ============================================================
 *  NeonLink – Configuration File
 *  Edit these values to customize your URL shortener.
 * ============================================================
 */

// ─── GitHub Settings ────────────────────────────────────────
// Your GitHub username (e.g. "johndoe")
var GITHUB_OWNER = "sk9910084";

// Your GitHub repository name (e.g. "neonlink")
var GITHUB_REPO = "neonlink";

// Your GitHub Personal Access Token
// Get one at: https://github.com/settings/tokens (needs "repo" scope)
// WARNING: Never commit a real token to a public repo.
// Instead, enter it only inside the Admin Panel → GitHub Configuration.
var GITHUB_TOKEN = "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";

// Path to your links.json file inside the repo (usually just "links.json")
var GITHUB_FILE_PATH = "links.json";

// ─── Admin Settings ─────────────────────────────────────────
// Change this to your own password!
var ADMIN_PASSWORD = "sk9910084@Sk";

// ─── Site Settings ──────────────────────────────────────────
// The public base URL of your site (with trailing slash)
// Example: "https://yourusername.github.io/neonlink/"
// For local dev:  "http://127.0.0.1:5500/"
var SITE_BASE_URL = "https://sk9910084.github.io/neonlink/";  // Leave empty to auto-detect

// Countdown duration in seconds (redirect page)
var REDIRECT_COUNTDOWN = 20;

// ─── Storage ────────────────────────────────────────────────
// Where links are stored locally (localStorage key)
var LOCAL_STORAGE_KEY = "neonlink_links";

// Try to fetch links.json from GitHub Pages on load?
// Set true once you've deployed and pushed links.json
var FETCH_FROM_GITHUB = true;
