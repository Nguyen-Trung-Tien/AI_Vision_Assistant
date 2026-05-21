import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';

enum TtsPriority { high, normal }

class _TtsItem {
  final String text;
  final TtsPriority priority;
  _TtsItem(this.text, this.priority);
}

/// A lightweight TTS queue that:
/// - HIGH priority: interrupts immediately (danger alerts, system messages)
/// - NORMAL priority: waits for current speech to finish (max 3s), then speaks
/// - Drops oldest NORMAL item if queue is full (cap = 2)
class TtsQueue {
  TtsQueue(this._tts);

  final FlutterTts _tts;
  final List<_TtsItem> _queue = [];
  bool _isSpeaking = false;
  Timer? _drainTimer;

  static const int _normalCap = 2;
  static const Duration _maxWait = Duration(seconds: 3);

  void Function(bool)? onSpeakingChanged;

  /// Speak with HIGH priority — interrupts current speech immediately.
  Future<void> speakHigh(String text) async {
    if (text.trim().isEmpty) return;
    _drainTimer?.cancel();
    _queue.removeWhere((e) => e.priority == TtsPriority.normal);
    await _tts.stop();
    _isSpeaking = false;
    await _speak(text);
  }

  /// Speak with NORMAL priority — queued, will not interrupt current speech.
  Future<void> speakNormal(String text) async {
    if (text.trim().isEmpty) return;

    if (_isSpeaking) {
      // Evict oldest normal item if at cap
      final normals =
          _queue.where((e) => e.priority == TtsPriority.normal).toList();
      if (normals.length >= _normalCap) {
        _queue.remove(normals.first);
      }
      _queue.add(_TtsItem(text, TtsPriority.normal));
      // Schedule drain after max wait to avoid stale items
      _drainTimer?.cancel();
      _drainTimer = Timer(_maxWait, _drainQueue);
      return;
    }

    await _speak(text);
  }

  Future<void> _speak(String text) async {
    _isSpeaking = true;
    onSpeakingChanged?.call(true);
    try {
      await _tts.speak(text);
    } catch (e) {
      debugPrint('[TtsQueue] speak error: $e');
    }
    // onCompletionHandler will call markDone
  }

  /// Called by FlutterTts completion/cancel handlers.
  void markDone() {
    _isSpeaking = false;
    onSpeakingChanged?.call(false);
    _drainQueue();
  }

  void _drainQueue() {
    _drainTimer?.cancel();
    if (_queue.isEmpty || _isSpeaking) return;
    final next = _queue.removeAt(0);
    _speak(next.text);
  }

  Future<void> stop() async {
    _drainTimer?.cancel();
    _queue.clear();
    _isSpeaking = false;
    await _tts.stop();
    onSpeakingChanged?.call(false);
  }

  void dispose() {
    _drainTimer?.cancel();
    _queue.clear();
  }
}
