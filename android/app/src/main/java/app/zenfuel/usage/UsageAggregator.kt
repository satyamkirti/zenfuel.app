package app.zenfuel.usage

import java.util.Calendar
import java.util.TimeZone

/**
 * Turns Android usage events into daily foreground time per tracked app.
 *
 * Pure logic with no Android dependencies, so it is covered by JVM unit tests
 * (app/src/test/.../UsageAggregatorTest.kt).
 *
 * Rules:
 * - An app is on screen from the first of its activities resuming until all of them have stopped
 *   (Android 10+). A paused activity is still visible (under a dialog, in picture-in-picture or a
 *   split-screen pane), so it keeps counting until it stops. Android 7–9 log no stop events, so
 *   there a pause ends the visit ([pauseEndsVisibility]). Several packages of one app (e.g. Lite
 *   versions) are merged.
 * - Screen off and device shutdown end every open interval. After a device startup without a
 *   logged shutdown the end time is unknown, so the open interval is dropped (undercount, never
 *   overcount).
 * - If the first event seen for a package is a pause (the app was already open when the query
 *   window began), the interval starts at the window start, but only within ORPHAN_MAX_MS of it.
 * - An interval still open at the end of the window ends at the window end ("now").
 * - Intervals are split at local midnight in [timeZone]; DST days are 23 or 25 hours long.
 * - Visits: intervals of one app separated by less than VISIT_GAP_MS are one visit, counted on the
 *   day the visit started.
 * - A day is only reported when Android's event history covers the whole day (see
 *   [earliestEventAt]); today is always reported.
 */
object UsageAggregator {

    const val ALGORITHM_VERSION = 2
    const val VISIT_GAP_MS = 60_000L
    const val ORPHAN_MAX_MS = 24 * 60 * 60_000L

    enum class Kind { RESUMED, PAUSED, STOPPED, SCREEN_OFF, SHUTDOWN, STARTUP }

    data class Event(val timestamp: Long, val packageName: String, val className: String?, val kind: Kind)

    data class Interval(val start: Long, val end: Long)

    data class DayUsage(val day: String, val appId: String, val foregroundMs: Long, val visits: Int)

    /**
     * @param events events in timestamp order (out-of-order input is sorted).
     * @param packageToApp tracked package -> app ID. Other packages are ignored.
     * @param windowStart start of the event query (usually rangeStart minus a lookback).
     * @param rangeStart local midnight of the first day to report.
     * @param now end of the window.
     * @param earliestEventAt timestamp of the oldest event Android returned for the window, of any
     *   package, or null if none. Days starting before it are incomplete and not reported.
     * @param pauseEndsVisibility true on Android 7–9, which have no stop events.
     */
    fun aggregate(
        events: List<Event>,
        packageToApp: Map<String, String>,
        windowStart: Long,
        rangeStart: Long,
        now: Long,
        timeZone: TimeZone,
        earliestEventAt: Long?,
        pauseEndsVisibility: Boolean = false,
    ): List<DayUsage> {
        val perApp = foregroundIntervals(events, packageToApp, windowStart, now, pauseEndsVisibility)
        val days = dayStarts(rangeStart, now, timeZone)
        val todayStart = days.last()
        // A day is complete when Android still has events from before it began (allowing for the
        // lookback that is part of every query).
        val reportable = days.filter { start -> start == todayStart || (earliestEventAt != null && earliestEventAt <= start) }

        val out = ArrayList<DayUsage>()
        val appIds = packageToApp.values.toSortedSet()
        for (start in reportable) {
            val end = nextDayStart(start, timeZone)
            val key = dayKey(start, timeZone)
            for (appId in appIds) {
                val intervals = perApp[appId].orEmpty()
                var ms = 0L
                for (iv in intervals) {
                    val s = maxOf(iv.start, start, rangeStart)
                    val e = minOf(iv.end, end, now)
                    if (e > s) ms += e - s
                }
                val visits = visitStarts(intervals).count { it >= start && it < end }
                out.add(DayUsage(key, appId, ms, visits))
            }
        }
        return out
    }

    /** Merged foreground intervals per app ID. */
    fun foregroundIntervals(
        events: List<Event>,
        packageToApp: Map<String, String>,
        windowStart: Long,
        now: Long,
        pauseEndsVisibility: Boolean = false,
    ): Map<String, List<Interval>> {
        val sorted = events.sortedBy { it.timestamp }
        val open = HashMap<String, MutableSet<String>>() // package -> visible activity classes
        val openSince = HashMap<String, Long>()
        val seen = HashSet<String>()
        val raw = HashMap<String, MutableList<Interval>>()

        fun close(pkg: String, at: Long) {
            val since = openSince.remove(pkg) ?: return
            open.remove(pkg)
            val appId = packageToApp[pkg] ?: return
            if (at > since) raw.getOrPut(appId) { ArrayList() }.add(Interval(since, at))
        }

        for (ev in sorted) {
            if (ev.timestamp < windowStart || ev.timestamp > now) continue
            when (ev.kind) {
                Kind.SCREEN_OFF, Kind.SHUTDOWN -> openSince.keys.toList().forEach { close(it, ev.timestamp) }
                Kind.STARTUP -> { openSince.clear(); open.clear() }
                Kind.RESUMED -> {
                    if (ev.packageName !in packageToApp) continue
                    seen.add(ev.packageName)
                    val classes = open.getOrPut(ev.packageName) { HashSet() }
                    if (classes.isEmpty() && ev.packageName !in openSince) openSince[ev.packageName] = ev.timestamp
                    classes.add(ev.className ?: "")
                }
                Kind.PAUSED, Kind.STOPPED -> {
                    val pkg = ev.packageName
                    // Still visible after a pause on Android 10+; only the stop ends it.
                    if (ev.kind == Kind.PAUSED && !pauseEndsVisibility && open[pkg]?.contains(ev.className ?: "") == true) continue
                    if (pkg !in packageToApp) continue
                    val firstForPackage = seen.add(pkg)
                    val classes = open[pkg]
                    if (classes == null || pkg !in openSince) {
                        // Already open when the window began: count from the window start.
                        if (firstForPackage && ev.timestamp - windowStart <= ORPHAN_MAX_MS) {
                            packageToApp[pkg]?.let { raw.getOrPut(it) { ArrayList() }.add(Interval(windowStart, ev.timestamp)) }
                        }
                        continue
                    }
                    classes.remove(ev.className ?: "")
                    if (classes.isEmpty()) close(pkg, ev.timestamp)
                }
            }
        }
        openSince.keys.toList().forEach { close(it, now) }
        return raw.mapValues { (_, list) -> merge(list) }
    }

    /** Sorts and merges overlapping or touching intervals. */
    fun merge(intervals: List<Interval>): List<Interval> {
        if (intervals.isEmpty()) return emptyList()
        val sorted = intervals.sortedBy { it.start }
        val out = ArrayList<Interval>()
        var cur = sorted[0]
        for (iv in sorted.drop(1)) {
            cur = if (iv.start <= cur.end) Interval(cur.start, maxOf(cur.end, iv.end)) else { out.add(cur); iv }
        }
        out.add(cur)
        return out
    }

    /** Start times of visits: merged intervals with gaps shorter than VISIT_GAP_MS joined. */
    fun visitStarts(merged: List<Interval>): List<Long> {
        val starts = ArrayList<Long>()
        var lastEnd = Long.MIN_VALUE
        for (iv in merged) {
            if (starts.isEmpty() || iv.start - lastEnd >= VISIT_GAP_MS) starts.add(iv.start)
            lastEnd = maxOf(lastEnd, iv.end)
        }
        return starts
    }

    fun startOfDay(ms: Long, timeZone: TimeZone): Long {
        val c = Calendar.getInstance(timeZone)
        c.timeInMillis = ms
        c.set(Calendar.HOUR_OF_DAY, 0); c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 0); c.set(Calendar.MILLISECOND, 0)
        return c.timeInMillis
    }

    fun nextDayStart(dayStart: Long, timeZone: TimeZone): Long {
        val c = Calendar.getInstance(timeZone)
        c.timeInMillis = dayStart
        c.add(Calendar.DAY_OF_MONTH, 1)
        c.set(Calendar.HOUR_OF_DAY, 0); c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 0); c.set(Calendar.MILLISECOND, 0)
        return c.timeInMillis
    }

    /** Local midnight `days - 1` days before the day containing `now`. */
    fun rangeStart(now: Long, days: Int, timeZone: TimeZone): Long {
        val c = Calendar.getInstance(timeZone)
        c.timeInMillis = startOfDay(now, timeZone)
        c.add(Calendar.DAY_OF_MONTH, -(days - 1))
        c.set(Calendar.HOUR_OF_DAY, 0); c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 0); c.set(Calendar.MILLISECOND, 0)
        return c.timeInMillis
    }

    fun dayStarts(rangeStart: Long, now: Long, timeZone: TimeZone): List<Long> {
        val out = ArrayList<Long>()
        var d = startOfDay(rangeStart, timeZone)
        while (d <= now) { out.add(d); d = nextDayStart(d, timeZone) }
        return out
    }

    fun dayKey(ms: Long, timeZone: TimeZone): String {
        val c = Calendar.getInstance(timeZone)
        c.timeInMillis = ms
        return "%04d-%02d-%02d".format(c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH))
    }
}
