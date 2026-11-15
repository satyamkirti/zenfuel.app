package app.zenfuel.usage

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

/**
 * Best-effort background refresh through WorkManager, about once an hour. Android decides when it
 * actually runs (Doze, battery saver and app standby can delay it for hours), so limit alerts are
 * not real-time. No foreground service is used.
 */
class UsageRefreshWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        // Today and yesterday, so a day that ended while the phone was idle is completed.
        UsageSync.sync(applicationContext, days = 2)
        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "zenfuel-usage-refresh"

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<UsageRefreshWorker>(1, TimeUnit.HOURS).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request)
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }
}
