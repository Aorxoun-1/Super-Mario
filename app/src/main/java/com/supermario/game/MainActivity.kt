package com.supermario.game

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.Vibrator
import android.os.VibratorManager
import android.view.KeyEvent
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : Activity() {

    private var webView: WebView? = null
    private lateinit var vibrator: Vibrator

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 震动服务
        vibrator = if (Build.VERSION.SDK_INT >= 31) {
            val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vm.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        // Edge-to-Edge：监听系统栏安全区，传给 JS
        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            val density = resources.displayMetrics.density
            val top = (bars.top / density).toInt()
            val bottom = (bars.bottom / density).toInt()
            val left = (bars.left / density).toInt()
            val right = (bars.right / density).toInt()
            val js = "window.__safeArea={top:$top,bottom:$bottom,left:$left,right:$right};" +
                     "window.dispatchEvent(new Event('safeAreaChange'))"
            webView?.evaluateJavascript(js, null)
            WindowInsetsCompat.CONSUMED
        }

        webView = WebView(this).apply {
            isFocusable = true
            isFocusableInTouchMode = true

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = true
                mediaPlaybackRequiresUserGesture = false
                useWideViewPort = true
                loadWithOverviewMode = true
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
            }

            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()

            // 注入震动桥接
            addJavascriptInterface(VibrateBridge(), "AndroidVibrate")

            loadUrl("file:///android_asset/index.html")
        }

        setContentView(webView!!)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) webView?.requestFocus()
    }

    override fun onPause() {
        super.onPause()
        webView?.evaluateJavascript("window.__stopGame&&__stopGame()", null)
    }

    override fun onResume() {
        super.onResume()
        webView?.evaluateJavascript("window.__startGame&&__startGame()", null)
    }

    override fun onDestroy() {
        webView?.let { wv ->
            wv.evaluateJavascript("window.__destroyGame&&__destroyGame()", null)
            (wv.parent as? ViewGroup)?.removeView(wv)
            wv.stopLoading()
            wv.settings.javaScriptEnabled = false
            wv.destroy()
        }
        webView = null
        super.onDestroy()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (injectKey(event)) return true
        return super.dispatchKeyEvent(event)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        if (injectKey(event)) return true
        return super.onKeyDown(keyCode, event)
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
        if (injectKey(event)) return true
        return super.onKeyUp(keyCode, event)
    }

    private fun injectKey(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK || event.repeatCount > 0) return false
        val code = when (event.keyCode) {
            KeyEvent.KEYCODE_A -> "KeyA"
            KeyEvent.KEYCODE_D -> "KeyD"
            KeyEvent.KEYCODE_SPACE -> "Space"
            KeyEvent.KEYCODE_ESCAPE, KeyEvent.KEYCODE_P -> "Escape"
            KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER -> "Enter"
            KeyEvent.KEYCODE_DPAD_LEFT -> "ArrowLeft"
            KeyEvent.KEYCODE_DPAD_RIGHT -> "ArrowRight"
            else -> return false
        }
        val down = event.action == KeyEvent.ACTION_DOWN
        webView?.evaluateJavascript(
            "window.__keys&&(window.__keys['$code']=$down)", null
        )
        return true
    }

    /** JS 可调用的震动桥接 */
    inner class VibrateBridge {
        @JavascriptInterface
        fun vibrate(millis: Int) {
            if (millis > 0) {
                vibrator.vibrate(android.os.VibrationEffect.createOneShot(
                    millis.toLong(),
                    android.os.VibrationEffect.DEFAULT_AMPLITUDE
                ))
            }
        }
    }
}
