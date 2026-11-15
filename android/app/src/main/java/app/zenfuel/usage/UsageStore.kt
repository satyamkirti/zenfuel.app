package app.zenfuel.usage

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * Daily usage totals in an on-device SQLite database (Android's built-in SQLite, no library).
 *
 * One row per (local day, app). Every refresh recomputes whole days, and [MergeRule] decides
 * whether a recomputed row replaces the stored one, so running the same refresh twice changes
 * nothing.
 *
 * The database is excluded from Android cloud backup and device transfer
 * (res/xml/data_extraction_rules.xml, allowBackup=false).
 *
 * Schema history:
 *   1 — daily_usage(day, app_id, foreground_ms, visits, updated_at, algorithm_version)
 */
class UsageStore private constructor(context: Context) :
    SQLiteOpenHelper(context.applicationContext, DB_NAME, null, SCHEMA_VERSION) {

    data class Row(val day: String, val appId: String, val foregroundMs: Long, val visits: Int, val updatedAt: Long, val algorithmVersion: Int)

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE daily_usage (
                day TEXT NOT NULL,
                app_id TEXT NOT NULL,
                foreground_ms INTEGER NOT NULL,
                visits INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                algorithm_version INTEGER NOT NULL,
                PRIMARY KEY (day, app_id)
            )
            """.trimIndent(),
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Future schema changes go here as ALTER TABLE steps, keeping existing rows.
    }

    override fun onDowngrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // An older app build cannot read a newer schema. Usage can be recomputed from Android for
        // the last few days, so start again rather than crash.
        db.execSQL("DROP TABLE IF EXISTS daily_usage")
        onCreate(db)
    }

    /** Applies recomputed rows. Returns how many rows changed. */
    fun upsert(rows: List<Row>): Int {
        if (rows.isEmpty()) return 0
        val db = writableDatabase
        var changed = 0
        db.beginTransaction()
        try {
            for (row in rows) {
                val existing = find(db, row.day, row.appId)
                if (!MergeRule.shouldReplace(existing, row)) continue
                val v = ContentValues().apply {
                    put("day", row.day)
                    put("app_id", row.appId)
                    put("foreground_ms", row.foregroundMs)
                    put("visits", row.visits)
                    put("updated_at", row.updatedAt)
                    put("algorithm_version", row.algorithmVersion)
                }
                db.insertWithOnConflict("daily_usage", null, v, SQLiteDatabase.CONFLICT_REPLACE)
                changed++
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
        return changed
    }

    fun range(fromDay: String, toDay: String): List<Row> {
        val out = ArrayList<Row>()
        readableDatabase.query(
            "daily_usage",
            arrayOf("day", "app_id", "foreground_ms", "visits", "updated_at", "algorithm_version"),
            "day >= ? AND day <= ?", arrayOf(fromDay, toDay), null, null, "day ASC, app_id ASC",
        ).use { c ->
            while (c.moveToNext()) out.add(Row(c.getString(0), c.getString(1), c.getLong(2), c.getInt(3), c.getLong(4), c.getInt(5)))
        }
        return out
    }

    fun firstDay(): String? =
        readableDatabase.rawQuery("SELECT MIN(day) FROM daily_usage", null).use { c -> if (c.moveToFirst() && !c.isNull(0)) c.getString(0) else null }

    fun clear() {
        writableDatabase.delete("daily_usage", null, null)
    }

    private fun find(db: SQLiteDatabase, day: String, appId: String): Row? =
        db.query(
            "daily_usage",
            arrayOf("day", "app_id", "foreground_ms", "visits", "updated_at", "algorithm_version"),
            "day = ? AND app_id = ?", arrayOf(day, appId), null, null, null,
        ).use { c -> if (c.moveToFirst()) Row(c.getString(0), c.getString(1), c.getLong(2), c.getInt(3), c.getLong(4), c.getInt(5)) else null }

    companion object {
        const val DB_NAME = "zenfuel_usage.db"
        const val SCHEMA_VERSION = 1

        @Volatile private var instance: UsageStore? = null

        fun get(context: Context): UsageStore =
            instance ?: synchronized(this) { instance ?: UsageStore(context).also { instance = it } }
    }
}

/**
 * Whether a recomputed day should replace the stored one.
 *
 * Android deletes detailed events after roughly a week, and a recomputation from a partly deleted
 * history can only come out smaller. So a smaller total never replaces a stored one, unless it
 * comes from a newer version of the aggregation rules.
 */
object MergeRule {
    fun shouldReplace(existing: UsageStore.Row?, incoming: UsageStore.Row): Boolean {
        if (existing == null) return true
        if (incoming.algorithmVersion != existing.algorithmVersion) return incoming.algorithmVersion > existing.algorithmVersion
        if (incoming.foregroundMs != existing.foregroundMs) return incoming.foregroundMs > existing.foregroundMs
        return incoming.visits > existing.visits
    }
}
