package app.zenfuel.usage

import app.zenfuel.usage.UsageAggregator.Event
import app.zenfuel.usage.UsageAggregator.Kind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class UsageAggregatorTest {
    private val ist = TimeZone.getTimeZone("Asia/Kolkata")
    private val apps = mapOf("com.instagram.android" to "instagram", "com.instagram.lite" to "instagram", "com.google.android.youtube" to "youtube")
    private val min = 60_000L

    private fun at(tz: TimeZone, y: Int, mo: Int, d: Int, h: Int, mi: Int = 0, s: Int = 0): Long =
        Calendar.getInstance(tz).apply { clear(); set(y, mo - 1, d, h, mi, s) }.timeInMillis

    private fun t(d: Int, h: Int, mi: Int = 0, s: Int = 0) = at(ist, 2026, 10, d, h, mi, s)
    private fun resumed(ts: Long, pkg: String, cls: String = "Main") = Event(ts, pkg, cls, Kind.RESUMED)
    private fun stopped(ts: Long, pkg: String, cls: String = "Main") = Event(ts, pkg, cls, Kind.STOPPED)

    /** Two days (23rd and 24th) with history reaching back before them. */
    private fun run(events: List<Event>, now: Long = t(24, 23), days: Int = 2, tz: TimeZone = ist, earliest: Long? = 0L, pauseEnds: Boolean = false): Map<String, UsageAggregator.DayUsage> {
        val rangeStart = UsageAggregator.rangeStart(now, days, tz)
        return UsageAggregator.aggregate(events, apps, rangeStart - UsageSync.LOOKBACK_MS, rangeStart, now, tz, earliest, pauseEnds)
            .associateBy { "${it.day}:${it.appId}" }
    }

    @Test fun `single session is counted once on its day`() {
        val r = run(listOf(resumed(t(24, 10), "com.instagram.android"), stopped(t(24, 10, 25), "com.instagram.android")))
        assertEquals(25 * min, r["2026-10-24:instagram"]!!.foregroundMs)
        assertEquals(1, r["2026-10-24:instagram"]!!.visits)
        assertEquals(0L, r["2026-10-23:instagram"]!!.foregroundMs)
    }

    @Test fun `session across midnight is split between the two days`() {
        val r = run(listOf(resumed(t(23, 23, 50), "com.google.android.youtube"), stopped(t(24, 0, 20), "com.google.android.youtube")))
        assertEquals(10 * min, r["2026-10-23:youtube"]!!.foregroundMs)
        assertEquals(20 * min, r["2026-10-24:youtube"]!!.foregroundMs)
        assertEquals(1, r["2026-10-23:youtube"]!!.visits)
        assertEquals(0, r["2026-10-24:youtube"]!!.visits)
    }

    @Test fun `moving between activities inside an app is one continuous visit`() {
        // Real order on Android 10+: old screen pauses, new one resumes, old one stops.
        val p = "com.instagram.android"
        val r = run(listOf(
            resumed(t(24, 9), p, "Feed"), Event(t(24, 9, 5), p, "Feed", Kind.PAUSED), resumed(t(24, 9, 5, 1), p, "Story"),
            stopped(t(24, 9, 5, 2), p, "Feed"), Event(t(24, 9, 15), p, "Story", Kind.PAUSED), stopped(t(24, 9, 15, 1), p, "Story"),
        ))
        val day = r["2026-10-24:instagram"]!!
        assertEquals(15 * min + 1000, day.foregroundMs)
        assertEquals(1, day.visits)
    }

    @Test fun `an app covered by a dialog keeps counting until it stops`() {
        // Seen on the emulator: YouTube paused behind a permission dialog for 49 s before stopping.
        val y = "com.google.android.youtube"
        val r = run(listOf(resumed(t(24, 10), y), Event(t(24, 10, 0, 1), y, "Main", Kind.PAUSED), stopped(t(24, 10, 0, 50), y)))
        assertEquals(50_000L, r["2026-10-24:youtube"]!!.foregroundMs)
    }

    @Test fun `on Android 7 to 9 a pause ends the visit`() {
        val y = "com.google.android.youtube"
        val r = run(listOf(resumed(t(24, 10), y), Event(t(24, 10, 0, 1), y, "Main", Kind.PAUSED)), pauseEnds = true)
        assertEquals(1_000L, r["2026-10-24:youtube"]!!.foregroundMs)
    }

    @Test fun `visits separated by a minute or more are counted separately`() {
        val p = "com.instagram.android"
        val r = run(listOf(
            resumed(t(24, 8), p), stopped(t(24, 8, 10), p),
            resumed(t(24, 8, 10, 59), p), stopped(t(24, 8, 20), p), // 59 s gap: same visit
            resumed(t(24, 8, 21, 1), p), stopped(t(24, 8, 30), p),  // 61 s gap: new visit
        ))
        assertEquals(2, r["2026-10-24:instagram"]!!.visits)
    }

    @Test fun `lite and full versions of one app are not double counted`() {
        val r = run(listOf(
            resumed(t(24, 12), "com.instagram.android"), resumed(t(24, 12, 10), "com.instagram.lite"),
            stopped(t(24, 12, 20), "com.instagram.android"), stopped(t(24, 12, 30), "com.instagram.lite"),
        ))
        assertEquals(30 * min, r["2026-10-24:instagram"]!!.foregroundMs)
    }

    @Test fun `screen off ends an open session`() {
        val r = run(listOf(resumed(t(24, 22), "com.google.android.youtube"), Event(t(24, 22, 40), "", null, Kind.SCREEN_OFF), stopped(t(24, 23), "com.google.android.youtube")), now = t(24, 23, 30))
        assertEquals(40 * min, r["2026-10-24:youtube"]!!.foregroundMs)
    }

    @Test fun `shutdown closes sessions and startup without shutdown drops them`() {
        val y = "com.google.android.youtube"
        val closed = run(listOf(resumed(t(24, 10), y), Event(t(24, 10, 30), "", null, Kind.SHUTDOWN), Event(t(24, 11), "", null, Kind.STARTUP)))
        assertEquals(30 * min, closed["2026-10-24:youtube"]!!.foregroundMs)
        val lost = run(listOf(resumed(t(24, 10), y), Event(t(24, 11), "", null, Kind.STARTUP), stopped(t(24, 12), y)))
        assertEquals(0L, lost["2026-10-24:youtube"]!!.foregroundMs)
    }

    @Test fun `a session still open is counted up to now`() {
        val r = run(listOf(resumed(t(24, 18), "com.instagram.android")), now = t(24, 18, 45))
        assertEquals(45 * min, r["2026-10-24:instagram"]!!.foregroundMs)
    }

    @Test fun `untracked apps and ZenFuel are ignored`() {
        val r = run(listOf(resumed(t(24, 9), "com.example.other"), stopped(t(24, 10), "com.example.other"), resumed(t(24, 9), "app.zenfuel"), stopped(t(24, 10), "app.zenfuel")))
        assertTrue(r.keys.none { it.contains("other") || it.contains("zenfuel") })
        assertTrue(r.values.all { it.foregroundMs == 0L })
    }

    @Test fun `events after now and out of order input are handled`() {
        val p = "com.instagram.android"
        val r = run(listOf(stopped(t(24, 9, 30), p), resumed(t(24, 9), p), resumed(t(24, 20), p), stopped(t(24, 21), p)), now = t(24, 19))
        assertEquals(30 * min, r["2026-10-24:instagram"]!!.foregroundMs)
    }

    @Test fun `days without full history are not reported but today always is`() {
        // History starts at 06:00 on the 24th: the 23rd is incomplete.
        val r = run(listOf(resumed(t(24, 7), "com.instagram.android"), stopped(t(24, 7, 5), "com.instagram.android")), earliest = t(24, 6))
        assertFalse(r.containsKey("2026-10-23:instagram"))
        assertEquals(5 * min, r["2026-10-24:instagram"]!!.foregroundMs)
        // No events at all: today is reported as zero, never invented.
        val empty = run(emptyList(), earliest = null)
        assertEquals(setOf("2026-10-24:instagram", "2026-10-24:youtube"), empty.keys)
        assertTrue(empty.values.all { it.foregroundMs == 0L && it.visits == 0 })
    }

    @Test fun `app already open when the window began is not counted into the reported days`() {
        // The pause arrives with no matching resume (open before the lookback window).
        val r = run(listOf(stopped(t(24, 1), "com.google.android.youtube")))
        assertEquals(0L, r["2026-10-24:youtube"]!!.foregroundMs)
    }

    @Test fun `daylight saving days split at local midnight`() {
        val ny = TimeZone.getTimeZone("America/New_York")
        // Clocks go forward at 02:00 on 2026-03-08 (a 23-hour day).
        val start = UsageAggregator.startOfDay(at(ny, 2026, 3, 8, 12), ny)
        assertEquals(23 * 60 * min, UsageAggregator.nextDayStart(start, ny) - start)
        val y = "com.google.android.youtube"
        val r = run(listOf(resumed(at(ny, 2026, 3, 7, 23, 30), y), stopped(at(ny, 2026, 3, 8, 3, 30), y)), now = at(ny, 2026, 3, 8, 20), tz = ny)
        assertEquals(30 * min, r["2026-03-07:youtube"]!!.foregroundMs)
        // 00:00 -> 03:30 local is 2.5 real hours because 02:00-03:00 does not exist.
        assertEquals(150 * min, r["2026-03-08:youtube"]!!.foregroundMs)
    }

    @Test fun `day keys follow the given time zone`() {
        val utcMidnight = at(TimeZone.getTimeZone("UTC"), 2026, 10, 24, 0)
        assertEquals("2026-10-24", UsageAggregator.dayKey(utcMidnight, ist)) // 05:30 in India
        assertEquals("2026-10-23", UsageAggregator.dayKey(utcMidnight, TimeZone.getTimeZone("America/New_York")))
    }

    @Test fun `refresh covers every day since the last successful one`() {
        assertEquals(UsageSync.MAX_DAYS, UsageSync.daysToCover(2, null, t(24, 12), ist))
        assertEquals(2, UsageSync.daysToCover(2, t(24, 9), t(24, 12), ist))
        assertEquals(4, UsageSync.daysToCover(2, t(21, 22), t(24, 12), ist))
        assertEquals(UsageSync.MAX_DAYS, UsageSync.daysToCover(2, t(1, 9), t(24, 12), ist))
        assertEquals(UsageSync.MAX_DAYS, UsageSync.daysToCover(2, t(25, 9), t(24, 12), ist)) // clock moved back
    }

    @Test fun `aggregating the same events twice gives identical results`() {
        val events = listOf(resumed(t(24, 10), "com.instagram.android"), stopped(t(24, 11), "com.instagram.android"))
        assertEquals(run(events), run(events))
    }
}

class UsageConfigSelectionTest {
    private fun app(id: String, vararg packages: String) = TrackedApp(id, id, packages.toList(), 60)
    private val now = Calendar.getInstance(TimeZone.getTimeZone("Asia/Kolkata")).apply { clear(); set(2026, 9, 24, 20, 0) }.timeInMillis
    private val tz = TimeZone.getTimeZone("Asia/Kolkata")

    /** Every configure() replaces the whole config, so only the current selection is read. */
    private fun dayRows(config: UsageConfig, events: List<Event>): Map<String, Long> {
        val rangeStart = UsageAggregator.rangeStart(now, 1, tz)
        return UsageAggregator.aggregate(events, config.packageToApp("app.zenfuel"), rangeStart - UsageSync.LOOKBACK_MS, rangeStart, now, tz, 0L)
            .associate { it.appId to it.foregroundMs }
    }

    @Test fun `a removed app gets no new rows, so its stored history is left untouched`() {
        val before = UsageConfig(true, listOf(app("instagram", "com.instagram.android"), app("youtube", "com.google.android.youtube")), false, false, false, "")
        val after = before.copy(apps = before.apps.filter { it.id == "instagram" })
        val events = listOf(
            Event(now - 120 * 60_000L, "com.google.android.youtube", "Main", Kind.RESUMED),
            Event(now - 60 * 60_000L, "com.google.android.youtube", "Main", Kind.STOPPED),
        )
        assertEquals(setOf("instagram", "youtube"), dayRows(before, events).keys)
        // UsageStore.upsert only writes the rows it is given, so youtube's earlier rows stay as they were.
        assertEquals(setOf("instagram"), dayRows(after, events).keys)
        assertEquals(mapOf("com.instagram.android" to "instagram"), after.packageToApp("app.zenfuel"))
    }

    @Test fun `an empty selection reads no apps and ZenFuel itself is never read`() {
        assertTrue(UsageConfig(true, emptyList(), false, false, false, "").packageToApp("app.zenfuel").isEmpty())
        val withSelf = UsageConfig(true, listOf(app("x", "app.zenfuel", "com.twitter.android")), false, false, false, "")
        assertEquals(mapOf("com.twitter.android" to "x"), withSelf.packageToApp("app.zenfuel"))
    }
}

class MergeRuleTest {
    private fun row(ms: Long, visits: Int = 1, algo: Int = UsageAggregator.ALGORITHM_VERSION) = UsageStore.Row("2026-10-24", "instagram", ms, visits, 1L, algo)

    @Test fun `new rows are stored`() = assertTrue(MergeRule.shouldReplace(null, row(10)))
    @Test fun `a repeated refresh changes nothing`() = assertFalse(MergeRule.shouldReplace(row(10), row(10)))
    @Test fun `a larger total replaces the stored one`() = assertTrue(MergeRule.shouldReplace(row(10), row(20)))
    @Test fun `a smaller recomputation never shrinks a stored day`() = assertFalse(MergeRule.shouldReplace(row(20), row(10)))
    @Test fun `more visits with the same time replace`() = assertTrue(MergeRule.shouldReplace(row(10, 1), row(10, 2)))
    @Test fun `a newer algorithm version replaces even when smaller`() = assertTrue(MergeRule.shouldReplace(row(20, algo = 1), row(10, algo = 2)))
    @Test fun `an older algorithm version never replaces`() = assertFalse(MergeRule.shouldReplace(row(10, algo = 2), row(20, algo = 1)))
}

class LimitAlertRuleTest {
    private val apps = listOf(
        TrackedApp("instagram", "Instagram", listOf("com.instagram.android"), 60),
        TrackedApp("youtube", "YouTube", listOf("com.google.android.youtube"), null),
    )
    private val config = UsageConfig(true, apps, alertsEnabled = true, alertShowAppNames = false, discreet = false, discreetTitle = "")
    private val min = 60_000L

    @Test fun `below the limit nothing is alerted`() {
        val (c, _) = LimitAlertRule.evaluate("2026-10-24", mapOf("instagram" to 59 * min), apps, emptySet())
        assertTrue(c.isEmpty())
    }

    @Test fun `reaching the limit alerts once per day`() {
        val (first, stored) = LimitAlertRule.evaluate("2026-10-24", mapOf("instagram" to 60 * min), apps, emptySet())
        assertEquals(listOf("instagram"), first.map { it.appId })
        val (again, _) = LimitAlertRule.evaluate("2026-10-24", mapOf("instagram" to 90 * min), apps, stored)
        assertTrue(again.isEmpty())
        val (nextDay, nextStored) = LimitAlertRule.evaluate("2026-10-25", mapOf("instagram" to 61 * min), apps, stored)
        assertEquals(1, nextDay.size)
        assertEquals(setOf("2026-10-25|instagram"), nextStored)
    }

    @Test fun `apps without a limit never alert`() {
        val (c, _) = LimitAlertRule.evaluate("2026-10-24", mapOf("youtube" to 600 * min), apps, emptySet())
        assertTrue(c.isEmpty())
    }

    @Test fun `wording is neutral by default and on the lock screen`() {
        val crossing = listOf(LimitAlertRule.Crossing("instagram", "Instagram", 60))
        val neutral = LimitAlertRule.message(crossing, config)
        assertFalse(neutral.text.contains("Instagram"))
        val named = LimitAlertRule.message(crossing, config.copy(alertShowAppNames = true))
        assertTrue(named.text.contains("Instagram"))
        assertFalse(named.publicText.contains("Instagram"))
    }

    @Test fun `wording follows the app language sent by the web layer`() {
        val hindi = AlertMessages(
            title = "दैनिक सीमा पूरी हुई",
            one = "आज के लिए आपकी एक ऐप सीमा पूरी हो गई है।",
            many = "आज के लिए आपकी {count} ऐप सीमाएँ पूरी हो गई हैं।",
            namedOne = "{app} की दैनिक सीमा पूरी हो गई है।",
            namedMany = "{apps} की दैनिक सीमाएँ पूरी हो गई हैं।",
            discreet = "आपके लिए एक रिमाइंडर है।",
        )
        val two = listOf(LimitAlertRule.Crossing("instagram", "Instagram", 60), LimitAlertRule.Crossing("youtube", "YouTube", 30))
        val neutral = LimitAlertRule.message(two, config.copy(messages = hindi))
        assertEquals("दैनिक सीमा पूरी हुई", neutral.title)
        assertEquals("आज के लिए आपकी 2 ऐप सीमाएँ पूरी हो गई हैं।", neutral.text)
        val named = LimitAlertRule.message(two, config.copy(messages = hindi, alertShowAppNames = true))
        assertEquals("Instagram, YouTube की दैनिक सीमाएँ पूरी हो गई हैं।", named.text)
        assertEquals(neutral.text, named.publicText)
        val hidden = LimitAlertRule.message(two, config.copy(messages = hindi, discreet = true, discreetTitle = "निजी स्थान"))
        assertEquals("आपके लिए एक रिमाइंडर है।", hidden.text)
    }

    // (JSON parsing itself is not covered here: org.json is a stub in plain JVM unit tests.)
    @Test fun `a config without wording keeps the original English alerts`() {
        assertEquals(AlertMessages.DEFAULT, config.messages)
        val one = listOf(LimitAlertRule.Crossing("instagram", "Instagram", 60))
        val m = LimitAlertRule.message(one, config)
        assertEquals("Daily limit reached", m.title)
        assertEquals("One of your app limits for today has been reached.", m.text)
        assertEquals("Instagram has reached its daily limit.", LimitAlertRule.message(one, config.copy(alertShowAppNames = true)).text)
        val two = one + LimitAlertRule.Crossing("youtube", "YouTube", 30)
        assertEquals("2 of your app limits for today have been reached.", LimitAlertRule.message(two, config).text)
        assertEquals("Instagram, YouTube have reached their daily limits.", LimitAlertRule.message(two, config.copy(alertShowAppNames = true)).text)
    }

    @Test fun `hidden mode uses the neutral title and text`() {
        val m = LimitAlertRule.message(listOf(LimitAlertRule.Crossing("instagram", "Instagram", 60)), config.copy(alertShowAppNames = true, discreet = true, discreetTitle = "Notes"))
        assertEquals("Notes", m.title)
        assertEquals("You have a reminder.", m.text)
        assertFalse(m.publicTitle.contains("limit"))
    }
}
