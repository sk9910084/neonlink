// ============================================================
//  NeonLink Android App — MainActivity.java
//  A simple WebView app that loads your NeonLink site.
//
//  SETUP:
//  1. Create new Android Studio project (Empty Activity)
//  2. Replace MainActivity.java content with this file
//  3. Update SITE_URL to your GitHub Pages URL
//  4. Update AndroidManifest.xml (see bottom of this file)
//  5. Add splash screen drawable (optional)
// ============================================================

package com.neonlink.app;

import android.app.Activity;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.os.Handler;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public class MainActivity extends Activity {

    // ─── CONFIG ────────────────────────────────────────────
    private static final String SITE_URL = "https://YOUR_USERNAME.github.io/neonlink/";
    // Change the above to your GitHub Pages URL
    // ───────────────────────────────────────────────────────

    private WebView webView;
    private LinearLayout splashScreen;
    private LinearLayout errorScreen;
    private ProgressBar loadingBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Build layout programmatically (no XML required)
        buildLayout();

        // Show splash for 2 seconds
        new Handler().postDelayed(() -> {
            splashScreen.setVisibility(View.GONE);
            if (isConnected()) {
                loadSite();
            } else {
                showError();
            }
        }, 2000);
    }

    private void buildLayout() {
        // Root container
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(0xFF050509); // --bg color
        setContentView(root);

        // ── Splash Screen ──────────────────────────────────
        splashScreen = new LinearLayout(this);
        splashScreen.setOrientation(LinearLayout.VERTICAL);
        splashScreen.setGravity(0x11); // CENTER
        splashScreen.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT));
        splashScreen.setBackgroundColor(0xFF050509);

        TextView splashIcon = new TextView(this);
        splashIcon.setText("⚡");
        splashIcon.setTextSize(64);
        splashIcon.setGravity(0x11);

        TextView splashTitle = new TextView(this);
        splashTitle.setText("NEONLINK");
        splashTitle.setTextSize(28);
        splashTitle.setTextColor(0xFF00FF87);
        splashTitle.setGravity(0x11);
        splashTitle.setPadding(0, 16, 0, 8);

        TextView splashSub = new TextView(this);
        splashSub.setText("URL Shortener");
        splashSub.setTextSize(14);
        splashSub.setTextColor(0xFF6B6B8A);
        splashSub.setGravity(0x11);

        splashScreen.addView(splashIcon);
        splashScreen.addView(splashTitle);
        splashScreen.addView(splashSub);

        // ── Error Screen ───────────────────────────────────
        errorScreen = new LinearLayout(this);
        errorScreen.setOrientation(LinearLayout.VERTICAL);
        errorScreen.setGravity(0x11);
        errorScreen.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT));
        errorScreen.setVisibility(View.GONE);
        errorScreen.setPadding(48, 0, 48, 0);

        TextView errIcon = new TextView(this);
        errIcon.setText("📡");
        errIcon.setTextSize(48);
        errIcon.setGravity(0x11);

        TextView errTitle = new TextView(this);
        errTitle.setText("No Internet");
        errTitle.setTextSize(22);
        errTitle.setTextColor(0xFFFF4F4F);
        errTitle.setGravity(0x11);
        errTitle.setPadding(0, 16, 0, 8);

        TextView errSub = new TextView(this);
        errSub.setText("Please check your connection and try again.");
        errSub.setTextSize(14);
        errSub.setTextColor(0xFF6B6B8A);
        errSub.setGravity(0x11);

        Button retryBtn = new Button(this);
        retryBtn.setText("RETRY");
        retryBtn.setTextColor(0xFF00FF87);
        retryBtn.setBackgroundColor(0x2000FF87);
        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        btnParams.topMargin = 32;
        retryBtn.setLayoutParams(btnParams);
        retryBtn.setOnClickListener(v -> {
            if (isConnected()) {
                errorScreen.setVisibility(View.GONE);
                loadSite();
            }
        });

        errorScreen.addView(errIcon);
        errorScreen.addView(errTitle);
        errorScreen.addView(errSub);
        errorScreen.addView(retryBtn);

        // ── Progress Bar ───────────────────────────────────
        loadingBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        loadingBar.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 6));
        loadingBar.setIndeterminate(true);
        loadingBar.setVisibility(View.GONE);
        loadingBar.setProgressTintList(
                android.content.res.ColorStateList.valueOf(0xFF00FF87));

        // ── WebView ────────────────────────────────────────
        webView = new WebView(this);
        LinearLayout.LayoutParams wvParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT);
        webView.setLayoutParams(wvParams);
        webView.setVisibility(View.GONE);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setBuiltInZoomControls(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                loadingBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                loadingBar.setVisibility(View.GONE);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Open all links inside the WebView
                view.loadUrl(request.getUrl().toString());
                return true;
            }
        });

        // Assemble
        root.addView(splashScreen);
        root.addView(errorScreen);
        root.addView(loadingBar);
        root.addView(webView);
    }

    private void loadSite() {
        webView.setVisibility(View.VISIBLE);
        webView.loadUrl(SITE_URL);
    }

    private void showError() {
        errorScreen.setVisibility(View.VISIBLE);
    }

    private boolean isConnected() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo info = cm.getActiveNetworkInfo();
        return info != null && info.isConnected();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}

/*
 * ============================================================
 *  AndroidManifest.xml — Add these permissions & settings:
 * ============================================================
 *
 * Inside <manifest> tag:
 *   <uses-permission android:name="android.permission.INTERNET"/>
 *   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
 *
 * Inside <activity> tag:
 *   android:configChanges="orientation|screenSize|keyboardHidden"
 *   android:screenOrientation="portrait"
 *
 * ============================================================
 *  build.gradle (app) — Minimum settings:
 * ============================================================
 *
 *   compileSdk 34
 *   minSdk 21
 *   targetSdk 34
 *
 * ============================================================
 */
