package app.zenfuel.usage

import android.Manifest
import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.util.Log
import java.util.TimeZone

/**
 * Reads Android usage events for the tracked apps, stores daily totals and raises limit alerts.
 * Shared by the foreground refresh (UsagePlugin) and the background worker.
 *
 * Logging never includes package names, app IDs or durations.
 */
object UsageSync {
    private const val TAG = "ZenUsage"
    /** Events are read from this long before the first reported day, to find apps already open at midnight. */
    const val LOOKBACK_MS = 24 * 60 * 60_000L
    const val MAX_DAYS = 7

    enum class Result(val wire: String) { OK("ok"), PERMISSION_MISSING("permission-missing"), DISABLED("disabled"), NO_APPS("no-apps"), ERROR("error") }

    private val lock = Any()

    @Suppress("DEPRECATION") // unsafeCheckOpNoThrow is deprecated on API 36; still the documented check on 29+
    fun hasUsageAccess(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= 29) {
            appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
        }
        return if (mode == AppOpsManager.MODE_DEFAULT) {
            context.checkCallingOrSelfPermission(Manifest.permission.PACKAGE_USAGE_STATS) == PackageManager.PERMISSION_GRANTED
        } else {
            mode == AppOpsManager.MODE_ALLOWED
        }
    }

    fun sync(context: Context, days: Int, now: Long = System.currentTimeMillis()): Result = synchronized(lock) {
        val prefs = UsagePrefs(context)
        val result = try {
            run(context, prefs, days.coerceIn(1, MAX_DAYS), now)
        } catch (e: Exception) {
            Log.w(TAG, "Usage refresh failed: ${e.javaClass.simpleName}")
            Result.ERROR
        }
        prefs.lastSyncResult = result.wire
        if (result == Result.OK) prefs.lastSyncAt = now
        result
    }

    private fun run(context: Context, prefs: UsagePrefs, days: Int, now: Long): Result {
        val config = prefs.config
        if (!config.enabled) return Result.DISABLED
        val packageToApp = config.packageToApp(context.packageName)
        if (packageToApp.isEmpty()) return Result.NO_APPS
        if (!hasUsageAccess(context)) return Result.PERMISSION_MISSING

        val tz = TimeZone.getDefault()
        val rangeStart = UsageAggregator.rangeStart(now, daysToCover(days, prefs.lastSyncAt, now, tz), tz)
        val windowStart = rangeStart - LOOKBACK_MS
        val (events, earliest) = readEvents(context, windowStart, now, packageToApp.keys)
        val usage = UsageAggregator.aggregate(events, packageToApp, windowStart, rangeStart, now, tz, earliest, pauseEndsVisibility = Build.VERSION.SDK_INT < 29)

        UsageStore.get(context).upsert(usage.map {
            UsageStore.Row(it.day, it.appId, it.foregroundMs, it.visits, now, UsageAggregator.ALGORITHM_VERSION)
        })

        if (config.alertsEnabled && LimitNotifier.canNotify(context)) {
            val today = UsageAggregator.dayKey(now, tz)
            val todayUsage = usage.filter { it.day == today }.associate { it.appId to it.foregroundMs }
            val (crossings, alerted) = LimitAlertRule.evaluate(today, todayUsage, config.apps, prefs.alerted)
            if (crossings.isNotEmpty()) LimitNotifier.show(context, LimitAlertRule.message(crossings, config), config.messages)
            prefs.alerted = alerted
        }
        return Result.OK
    }

    /**
     * Days to recompute: at least [requested], and every day since the last successful refresh (all
     * of the last week on the first refresh), so days missed while the phone was off are filled in.
     */
    fun daysToCover(requested: Int, lastSyncAt: Long?, now: Long, tz: TimeZone): Int {
        if (lastSyncAt == null || lastSyncAt > now) return MAX_DAYS
        val days = UsageAggregator.dayStarts(UsageAggregator.startOfDay(lastSyncAt, tz), now, tz).size
        return maxOf(requested, days).coerceIn(1, MAX_DAYS)
    }

    /**
     * Foreground/background events for the tracked packages plus device-wide screen and power
     * events. Other apps' events are skipped while reading and never stored.
     * Also returns the time of the oldest event of any kind, which shows how far back Android's
     * history currently reaches.
     */
    private fun readEvents(context: Context, from: Long, to: Long, tracked: Set<String>): Pair<List<UsageAggregator.Event>, Long?> {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val events = usm.queryEvents(from, to) ?: return emptyList<UsageAggregator.Event>() to null
        val out = ArrayList<UsageAggregator.Event>()
        val e = UsageEvents.Event()
        var earliest: Long? = null
        while (events.hasNextEvent()) {
            if (!events.getNextEvent(e)) break
            if (earliest == null || e.timeStamp < earliest) earliest = e.timeStamp
            val kind = kindOf(e.eventType) ?: continue
            val pkg = e.packageName ?: continue
            val device = kind == UsageAggregator.Kind.SCREEN_OFF || kind == UsageAggregator.Kind.SHUTDOWN || kind == UsageAggregator.Kind.STARTUP
            if (!device && pkg !in tracked) continue
            out.add(UsageAggregator.Event(e.timeStamp, if (device) "" else pkg, if (device) null else e.className, kind))
        }
        return out to earliest
    }

    @Suppress("DEPRECATION")
    private fun kindOf(type: Int): UsageAggregator.Kind? = when (type) {
        UsageEvents.Event.MOVE_TO_FOREGROUND -> UsageAggregator.Kind.RESUMED // ACTIVITY_RESUMED on API 29+
        UsageEvents.Event.MOVE_TO_BACKGROUND -> UsageAggregator.Kind.PAUSED // ACTIVITY_PAUSED on API 29+
        ACTIVITY_STOPPED -> UsageAggregator.Kind.STOPPED
        SCREEN_NON_INTERACTIVE -> UsageAggregator.Kind.SCREEN_OFF
        DEVICE_SHUTDOWN -> UsageAggregator.Kind.SHUTDOWN
        DEVICE_STARTUP -> UsageAggregator.Kind.STARTUP
        else -> null
    }

    // Event type values from android.app.usage.UsageEvents.Event, listed here so the code compiles
    // against them on every supported API level (older devices simply never report them).
    private const val SCREEN_NON_INTERACTIVE = 16
    private const val ACTIVITY_STOPPED = 23
    private const val DEVICE_SHUTDOWN = 26
    private const val DEVICE_STARTUP = 27
}
