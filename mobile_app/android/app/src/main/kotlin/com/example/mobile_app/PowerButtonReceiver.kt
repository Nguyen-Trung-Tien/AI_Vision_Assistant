package com.example.mobile_app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * BroadcastReceiver that listens for SCREEN_ON and SCREEN_OFF events.
 * Each screen-off event is treated as a power button press.
 * When 5 presses are detected within a time window, the SOS is triggered.
 */
class PowerButtonReceiver(private val onSosTrigger: () -> Unit) : BroadcastReceiver() {

    private val pressTimes = mutableListOf<Long>()
    private val requiredPresses = 5
    private val timeWindowMs = 3000L // 5 presses within 3 seconds

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Intent.ACTION_SCREEN_OFF) {
            val now = System.currentTimeMillis()
            pressTimes.add(now)

            // Remove presses older than the time window
            pressTimes.removeAll { now - it > timeWindowMs }

            if (pressTimes.size >= requiredPresses) {
                pressTimes.clear()
                onSosTrigger()
            }
        }
    }
}
