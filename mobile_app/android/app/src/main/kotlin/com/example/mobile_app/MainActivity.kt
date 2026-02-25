package com.example.mobile_app

import android.content.Intent
import android.content.IntentFilter
import android.view.KeyEvent
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel

class MainActivity : FlutterActivity() {

    private var powerButtonReceiver: PowerButtonReceiver? = null
    private var powerEventSink: EventChannel.EventSink? = null
    private var volumeEventSink: EventChannel.EventSink? = null

    // Volume button rapid press detection
    private val volumePressTimes = mutableListOf<Long>()
    private val requiredPresses = 5
    private val timeWindowMs = 3000L

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // Power button EventChannel
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, "com.example.mobile_app/power_button")
            .setStreamHandler(object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    powerEventSink = events
                    registerPowerButtonReceiver()
                }

                override fun onCancel(arguments: Any?) {
                    unregisterPowerButtonReceiver()
                    powerEventSink = null
                }
            })

        // Volume button EventChannel
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, "com.example.mobile_app/volume_button")
            .setStreamHandler(object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    volumeEventSink = events
                }

                override fun onCancel(arguments: Any?) {
                    volumeEventSink = null
                }
            })
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            val now = System.currentTimeMillis()
            volumePressTimes.add(now)

            // Remove presses older than the time window
            volumePressTimes.removeAll { now - it > timeWindowMs }

            if (volumePressTimes.size >= requiredPresses) {
                volumePressTimes.clear()
                volumeEventSink?.success("sos_triggered")
                return true // Consume the event
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    private fun registerPowerButtonReceiver() {
        if (powerButtonReceiver == null) {
            powerButtonReceiver = PowerButtonReceiver {
                runOnUiThread {
                    powerEventSink?.success("sos_triggered")
                }
            }
            val filter = IntentFilter().apply {
                addAction(Intent.ACTION_SCREEN_OFF)
                addAction(Intent.ACTION_SCREEN_ON)
            }
            registerReceiver(powerButtonReceiver, filter)
        }
    }

    private fun unregisterPowerButtonReceiver() {
        powerButtonReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (_: Exception) {}
            powerButtonReceiver = null
        }
    }

    override fun onDestroy() {
        unregisterPowerButtonReceiver()
        super.onDestroy()
    }
}
