package app.zenfuel

import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import app.zenfuel.usage.UsagePlugin
import com.getcapacitor.Bridge
import com.getcapacitor.BridgeActivity
import com.getcapacitor.BridgeWebViewClient
import java.io.IOException

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(UsagePlugin::class.java)
        super.onCreate(savedInstanceState)
        bridge.setWebViewClient(RouteWebViewClient(bridge))
    }
}

/**
 * The app's pages are a Next.js static export: /settings is out/settings.html. Capacitor's local
 * server answers every extension-less path with index.html (single-page-app mode), which would
 * show the dashboard's HTML when a page such as /settings is reloaded. This serves the page's own
 * file instead; everything else is left to Capacitor.
 */
private class RouteWebViewClient(private val capBridge: Bridge) : BridgeWebViewClient(capBridge) {
    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
        val url = request.url
        val path = url.path.orEmpty().trimEnd('/')
        val isPage = request.isForMainFrame && url.host == "localhost" && path.isNotEmpty() &&
            !path.substringAfterLast('/').contains('.') && ROUTE_RE.matches(path)
        if (isPage) {
            try {
                val stream = capBridge.context.assets.open("public$path.html")
                return WebResourceResponse("text/html", "utf-8", capBridge.localServer.getJavaScriptInjectedStream(stream))
            } catch (_: IOException) {
                // Not an exported page; fall through to Capacitor (which serves index.html).
            }
        }
        return super.shouldInterceptRequest(view, request)
    }

    private companion object {
        val ROUTE_RE = Regex("^(/[a-z0-9-]+)+$")
    }
}
