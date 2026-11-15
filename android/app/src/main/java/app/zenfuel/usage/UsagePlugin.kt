package app.zenfuel.usage

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import org.json.JSONObject

/**
 * Bridge between the web UI (src/lib/usage/plugin.ts) and Android's usage statistics.
 * Usage figures never leave the device: there is no network code in this package.
 */
@CapacitorPlugin(
    name = "ZenUsage",
    permissions = [Permission(alias = UsagePlugin.NOTIFICATIONS, strings = [Manifest.permission.POST_NOTIFICATIONS])],
)
class UsagePlugin : Plugin() {

    private val prefs by lazy { UsagePrefs(context) }

    @PluginMethod
    fun getStatus(call: PluginCall) {
        val config = prefs.config
        call.resolve(JSObject().apply {
            put("usageAccess", if (UsageSync.hasUsageAccess(context)) "granted" else "denied")
            put("notifications", notificationState())
            put("trackingEnabled", config.enabled)
            put("lastSyncAt", prefs.lastSyncAt ?: JSONObject.NULL)
            put("lastSyncResult", prefs.lastSyncResult ?: JSONObject.NULL)
            put("firstDay", UsageStore.get(context).firstDay() ?: JSONObject.NULL)
        })
    }

    @PluginMethod
    fun openUsageAccessSettings(call: PluginCall) {
        val pkg = Uri.parse("package:${context.packageName}")
        val opened = tryStart(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, pkg)) ||
            tryStart(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) ||
            tryStart(Intent(Settings.ACTION_SETTINGS))
        call.resolve(JSObject().put("opened", opened))
    }

    @PluginMethod
    fun openNotificationSettings(call: PluginCall) {
        val opened = (Build.VERSION.SDK_INT >= 26 &&
            tryStart(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName))) ||
            tryStart(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}")))
        call.resolve(JSObject().put("opened", opened))
    }

    /** Only packages declared in the manifest's <queries> are visible on Android 11+. */
    @PluginMethod
    fun getInstalledPackages(call: PluginCall) {
        val requested = call.getArray("packages", JSArray())!!
        val installed = JSArray()
        for (i in 0 until minOf(requested.length(), 200)) {
            val pkg = requested.optString(i)
            if (pkg.isBlank() || pkg == context.packageName) continue
            val found = try {
                if (Build.VERSION.SDK_INT >= 33) context.packageManager.getPackageInfo(pkg, PackageManager.PackageInfoFlags.of(0))
                else @Suppress("DEPRECATION") context.packageManager.getPackageInfo(pkg, 0)
                true
            } catch (_: PackageManager.NameNotFoundException) {
                false
            }
            if (found) installed.put(pkg)
        }
        call.resolve(JSObject().put("installed", installed))
    }

    @PluginMethod
    fun configure(call: PluginCall) {
        val config = UsageConfig.fromJson(call.data)
        prefs.config = config
        if (config.enabled && config.apps.isNotEmpty()) UsageRefreshWorker.schedule(context) else UsageRefreshWorker.cancel(context)
        call.resolve()
    }

    @PluginMethod
    fun refresh(call: PluginCall) {
        val result = UsageSync.sync(context, call.getInt("days", 2) ?: 2)
        call.resolve(JSObject().apply {
            put("result", result.wire)
            put("lastSyncAt", prefs.lastSyncAt ?: JSONObject.NULL)
        })
    }

    @PluginMethod
    fun getDailyUsage(call: PluginCall) {
        val from = call.getString("fromDay").orEmpty()
        val to = call.getString("toDay").orEmpty()
        if (!DAY_RE.matches(from) || !DAY_RE.matches(to)) {
            call.reject("fromDay and toDay must be YYYY-MM-DD")
            return
        }
        val records = JSArray()
        UsageStore.get(context).range(from, to).forEach { r ->
            records.put(JSObject().apply {
                put("day", r.day)
                put("appId", r.appId)
                put("foregroundMs", r.foregroundMs)
                put("sessions", r.visits)
                put("updatedAt", r.updatedAt)
                put("schemaVersion", UsageStore.SCHEMA_VERSION)
            })
        }
        call.resolve(JSObject().put("records", records))
    }

    @PluginMethod
    fun clearUsageData(call: PluginCall) {
        UsageStore.get(context).clear()
        prefs.clearUsageState()
        call.resolve()
    }

    // ── Notification permission (Android 13+ asks at runtime) ────────────────────

    @PluginMethod
    override fun checkPermissions(call: PluginCall) {
        call.resolve(JSObject().put(NOTIFICATIONS, notificationState()))
    }

    @PluginMethod
    override fun requestPermissions(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState(NOTIFICATIONS) != PermissionState.GRANTED) {
            requestPermissionForAlias(NOTIFICATIONS, call, "notificationPermissionCallback")
        } else {
            checkPermissions(call)
        }
    }

    @PermissionCallback
    private fun notificationPermissionCallback(call: PluginCall) {
        checkPermissions(call)
    }

    private fun notificationState(): String {
        val enabled = NotificationManagerCompat.from(context).areNotificationsEnabled()
        if (Build.VERSION.SDK_INT < 33) return if (enabled) "granted" else "denied"
        val state = getPermissionState(NOTIFICATIONS)
        return when {
            state == PermissionState.GRANTED -> if (enabled) "granted" else "denied"
            state == null -> "prompt"
            else -> state.toString()
        }
    }

    private fun tryStart(intent: Intent): Boolean = try {
        val activity = activity ?: return false
        activity.startActivity(intent)
        true
    } catch (_: ActivityNotFoundException) {
        false
    } catch (_: SecurityException) {
        false
    }

    companion object {
        const val NOTIFICATIONS = "notifications"
        private val DAY_RE = Regex("^\\d{4}-\\d{2}-\\d{2}$")
    }
}
