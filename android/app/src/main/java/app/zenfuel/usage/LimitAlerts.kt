package app.zenfuel.usage

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import app.zenfuel.MainActivity
import app.zenfuel.R

/** Which limits have newly been reached. Pure, covered by unit tests. */
object LimitAlertRule {
    data class Crossing(val appId: String, val label: String, val limitMinutes: Int)

    /**
     * Apps whose measured time today has reached their limit and that have not been alerted
     * today. Returns the crossings and the alerted set to store (today's keys only).
     */
    fun evaluate(today: String, usage: Map<String, Long>, apps: List<TrackedApp>, alreadyAlerted: Set<String>): Pair<List<Crossing>, Set<String>> {
        val kept = alreadyAlerted.filter { it.startsWith("$today|") }.toMutableSet()
        val crossings = ArrayList<Crossing>()
        for (app in apps) {
            val limit = app.limitMinutes ?: continue
            val used = usage[app.id] ?: continue
            if (used < limit * 60_000L) continue
            if (kept.add("$today|${app.id}")) crossings.add(Crossing(app.id, app.label, limit))
        }
        return crossings to kept
    }

    data class Message(val title: String, val text: String, val publicTitle: String, val publicText: String)

    /**
     * Wording, in the language chosen in the app (config.messages). Hidden Mode always uses the
     * neutral title and text. App names appear only when the user turned them on, and never on
     * the lock-screen (public) version.
     */
    fun message(crossings: List<Crossing>, config: UsageConfig): Message {
        val words = config.messages
        if (config.discreet) {
            val title = config.discreetTitle.ifBlank { "Personal Space" }
            return Message(title, words.discreet, title, words.discreet)
        }
        val neutralTitle = words.title
        val neutralText = if (crossings.size == 1) words.one else words.many.replace("{count}", crossings.size.toString())
        if (!config.alertShowAppNames) return Message(neutralTitle, neutralText, neutralTitle, neutralText)
        val text = if (crossings.size == 1) words.namedOne.replace("{app}", crossings[0].label)
            else words.namedMany.replace("{apps}", crossings.joinToString(", ") { it.label })
        return Message(neutralTitle, text, neutralTitle, neutralText)
    }
}

object LimitNotifier {
    private const val CHANNEL_ID = "usage_limits"
    private const val NOTIFICATION_ID = 4101

    fun canNotify(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return false
        return NotificationManagerCompat.from(context).areNotificationsEnabled()
    }

    fun show(context: Context, message: LimitAlertRule.Message, words: AlertMessages = AlertMessages.DEFAULT) {
        if (!canNotify(context)) return
        val nm = NotificationManagerCompat.from(context)
        if (Build.VERSION.SDK_INT >= 26) {
            // Re-creating the channel updates its name and description to the current language.
            val channel = NotificationChannel(CHANNEL_ID, words.channel, NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = words.channelDescription
                lockscreenVisibility = NotificationCompat.VISIBILITY_PRIVATE
            }
            context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
        val open = PendingIntent.getActivity(
            context, 0,
            Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val publicVersion = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_limit)
            .setContentTitle(message.publicTitle)
            .setContentText(message.publicText)
            .build()
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_limit)
            .setContentTitle(message.title)
            .setContentText(message.text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message.text))
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPublicVersion(publicVersion)
            .setContentIntent(open)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .build()
        try {
            nm.notify(NOTIFICATION_ID, notification)
        } catch (_: SecurityException) {
            // Permission withdrawn between the check and the post.
        }
    }
}
