package app.zenfuel.usage

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/** One tracked app as configured in the web UI (src/lib/usage/catalog.ts). */
data class TrackedApp(val id: String, val label: String, val packages: List<String>, val limitMinutes: Int?)

/**
 * Limit-alert wording in the language chosen in the app (sent by the web layer, which holds all
 * translations). Placeholders: {count}, {app}, {apps}. Defaults are the original English text, used
 * when an older configuration has no wording.
 */
data class AlertMessages(
    val title: String = "Daily limit reached",
    val one: String = "One of your app limits for today has been reached.",
    val many: String = "{count} of your app limits for today have been reached.",
    val namedOne: String = "{app} has reached its daily limit.",
    val namedMany: String = "{apps} have reached their daily limits.",
    val discreet: String = "You have a reminder.",
    val channel: String = "Usage limit alerts",
    val channelDescription: String = "When a daily app limit you set is reached",
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("title", title); put("one", one); put("many", many); put("namedOne", namedOne)
        put("namedMany", namedMany); put("discreet", discreet); put("channel", channel)
        put("channelDescription", channelDescription)
    }

    companion object {
        val DEFAULT = AlertMessages()

        /** Validates input from JavaScript: each text is trimmed and capped; blanks keep the default. */
        fun fromJson(o: JSONObject?): AlertMessages {
            if (o == null) return DEFAULT
            fun s(key: String, fallback: String) = o.optString(key).trim().take(300).ifBlank { fallback }
            return AlertMessages(
                title = s("title", DEFAULT.title),
                one = s("one", DEFAULT.one),
                many = s("many", DEFAULT.many),
                namedOne = s("namedOne", DEFAULT.namedOne),
                namedMany = s("namedMany", DEFAULT.namedMany),
                discreet = s("discreet", DEFAULT.discreet),
                channel = s("channel", DEFAULT.channel).take(80),
                channelDescription = s("channelDescription", DEFAULT.channelDescription),
            )
        }
    }
}

/**
 * Screen-time settings mirrored from the web layer so background refresh and alerts can run while
 * the app is closed. The web layer's localStorage stays the source of truth and re-sends these on
 * every launch and change.
 */
data class UsageConfig(
    val enabled: Boolean,
    val apps: List<TrackedApp>,
    val alertsEnabled: Boolean,
    val alertShowAppNames: Boolean,
    val discreet: Boolean,
    val discreetTitle: String,
    val messages: AlertMessages = AlertMessages.DEFAULT,
) {
    /** Tracked package -> app ID, never including ZenFuel itself. */
    fun packageToApp(ownPackage: String): Map<String, String> =
        apps.flatMap { app -> app.packages.filter { it != ownPackage }.map { it to app.id } }.toMap()

    companion object {
        val DISABLED = UsageConfig(false, emptyList(), false, false, false, "")
        private val ID_RE = Regex("^[a-z0-9-]{1,64}$")
        private val PACKAGE_RE = Regex("^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+$")

        /** Validates input from JavaScript. Malformed entries are dropped, never trusted. */
        fun fromJson(o: JSONObject): UsageConfig {
            val apps = ArrayList<TrackedApp>()
            val seen = HashSet<String>()
            val arr = o.optJSONArray("apps") ?: JSONArray()
            for (i in 0 until minOf(arr.length(), 100)) {
                val a = arr.optJSONObject(i) ?: continue
                val id = a.optString("id")
                if (!ID_RE.matches(id) || !seen.add(id)) continue
                val pk = a.optJSONArray("packages") ?: continue
                val packages = (0 until minOf(pk.length(), 10)).map { pk.optString(it) }.filter { PACKAGE_RE.matches(it) }
                if (packages.isEmpty()) continue
                val limit = if (a.isNull("limitMinutes")) null else a.optInt("limitMinutes", 0).takeIf { it in 1..1440 }
                apps.add(TrackedApp(id, a.optString("label").take(60), packages, limit))
            }
            return UsageConfig(
                enabled = o.optBoolean("enabled", false),
                apps = apps,
                alertsEnabled = o.optBoolean("alertsEnabled", false),
                alertShowAppNames = o.optBoolean("alertShowAppNames", false),
                discreet = o.optBoolean("discreet", false),
                discreetTitle = o.optString("discreetTitle").trim().take(40),
                messages = AlertMessages.fromJson(o.optJSONObject("messages")),
            )
        }

        fun toJson(c: UsageConfig): JSONObject = JSONObject().apply {
            put("enabled", c.enabled)
            put("alertsEnabled", c.alertsEnabled)
            put("alertShowAppNames", c.alertShowAppNames)
            put("discreet", c.discreet)
            put("discreetTitle", c.discreetTitle)
            put("messages", c.messages.toJson())
            put("apps", JSONArray().apply {
                c.apps.forEach { app ->
                    put(JSONObject().apply {
                        put("id", app.id)
                        put("label", app.label)
                        put("packages", JSONArray(app.packages))
                        put("limitMinutes", app.limitMinutes ?: JSONObject.NULL)
                    })
                }
            })
        }
    }
}

/** Small key-value state kept by the native layer (no usage figures). */
class UsagePrefs(context: Context) {
    private val prefs: SharedPreferences = context.applicationContext.getSharedPreferences("zenfuel_usage", Context.MODE_PRIVATE)

    var config: UsageConfig
        get() = prefs.getString(KEY_CONFIG, null)?.let { runCatching { UsageConfig.fromJson(JSONObject(it)) }.getOrNull() } ?: UsageConfig.DISABLED
        set(value) { prefs.edit().putString(KEY_CONFIG, UsageConfig.toJson(value).toString()).apply() }

    var lastSyncAt: Long?
        get() = prefs.getLong(KEY_LAST_SYNC, 0L).takeIf { it > 0 }
        set(value) { prefs.edit().putLong(KEY_LAST_SYNC, value ?: 0L).apply() }

    var lastSyncResult: String?
        get() = prefs.getString(KEY_LAST_RESULT, null)
        set(value) { prefs.edit().putString(KEY_LAST_RESULT, value).apply() }

    /** "day|appId" keys of limits already alerted, so each crossing alerts once. */
    var alerted: Set<String>
        get() = prefs.getStringSet(KEY_ALERTED, emptySet()) ?: emptySet()
        set(value) { prefs.edit().putStringSet(KEY_ALERTED, HashSet(value)).apply() }

    fun clearUsageState() {
        prefs.edit().remove(KEY_LAST_SYNC).remove(KEY_LAST_RESULT).remove(KEY_ALERTED).apply()
    }

    private companion object {
        const val KEY_CONFIG = "config"
        const val KEY_LAST_SYNC = "last_sync_at"
        const val KEY_LAST_RESULT = "last_sync_result"
        const val KEY_ALERTED = "alerted"
    }
}
