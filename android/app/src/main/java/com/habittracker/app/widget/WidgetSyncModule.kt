package com.habittracker.app.widget

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetSyncModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "WidgetSyncModule"

  @ReactMethod
  fun updateHabits(habitsJson: String, promise: Promise) {
    try {
      WidgetStore.saveHabitsJson(reactApplicationContext, habitsJson)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("WIDGET_SYNC_FAILED", "Could not sync widget habits", e)
    }
  }
}
