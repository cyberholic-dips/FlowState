package com.habittracker.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import com.habittracker.app.MainActivity
import com.habittracker.app.R
import org.json.JSONArray

class HabitWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    appWidgetIds.forEach { appWidgetId ->
      renderWidget(context, appWidgetManager, appWidgetId)
    }
  }

  companion object {
    private data class WidgetHabit(val id: String, val name: String, val isCompleted: Boolean)

    fun renderWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
      val views = RemoteViews(context.packageName, R.layout.habit_widget)
      val habits = readHabits(context)
      val activeHabits = habits.filter { !it.isCompleted }.take(3)

      bindRow(context, views, 0, activeHabits.getOrNull(0))
      bindRow(context, views, 1, activeHabits.getOrNull(1))
      bindRow(context, views, 2, activeHabits.getOrNull(2))

      if (activeHabits.isEmpty()) {
        views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
      } else {
        views.setViewVisibility(R.id.widget_empty, View.GONE)
      }

      val openAppIntent = Intent(context, MainActivity::class.java)
      val openAppPendingIntent = PendingIntent.getActivity(
        context,
        9000,
        openAppIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      views.setOnClickPendingIntent(R.id.widget_title, openAppPendingIntent)

      appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun bindRow(context: Context, views: RemoteViews, rowIndex: Int, habit: WidgetHabit?) {
      val rowIds = intArrayOf(R.id.row_1, R.id.row_2, R.id.row_3)
      val titleIds = intArrayOf(R.id.habit_name_1, R.id.habit_name_2, R.id.habit_name_3)
      val doneIds = intArrayOf(R.id.habit_done_1, R.id.habit_done_2, R.id.habit_done_3)

      val rowId = rowIds[rowIndex]
      val titleId = titleIds[rowIndex]
      val doneId = doneIds[rowIndex]

      if (habit == null) {
        views.setViewVisibility(rowId, View.GONE)
        return
      }

      views.setViewVisibility(rowId, View.VISIBLE)
      views.setTextViewText(titleId, habit.name)

      val deepLink = Uri.parse("habittracker://complete-habit?habitId=${Uri.encode(habit.id)}")
      val intent = Intent(Intent.ACTION_VIEW, deepLink).apply {
        setClass(context, MainActivity::class.java)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }

      val requestCode = (habit.id.hashCode() and 0x7fffffff) + rowIndex
      val pendingIntent = PendingIntent.getActivity(
        context,
        requestCode,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      views.setOnClickPendingIntent(doneId, pendingIntent)
      views.setOnClickPendingIntent(titleId, pendingIntent)
    }

    private fun readHabits(context: Context): List<WidgetHabit> {
      return try {
        val json = WidgetStore.getHabitsJson(context)
        val arr = JSONArray(json)
        buildList {
          for (i in 0 until arr.length()) {
            val item = arr.optJSONObject(i) ?: continue
            val id = item.optString("id", "")
            if (id.isBlank()) continue
            val name = item.optString("name", "Habit")
            val isCompleted = item.optBoolean("isCompleted", false)
            add(WidgetHabit(id = id, name = name, isCompleted = isCompleted))
          }
        }
      } catch (_: Exception) {
        emptyList()
      }
    }
  }
}
