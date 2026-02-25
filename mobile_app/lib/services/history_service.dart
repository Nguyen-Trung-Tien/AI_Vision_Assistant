import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// A single recognition event stored in history.
class HistoryEntry {
  final DateTime timestamp;
  final String type; // 'money', 'text', 'caption', 'barcode'
  final String result;

  HistoryEntry({
    required this.timestamp,
    required this.type,
    required this.result,
  });

  Map<String, dynamic> toJson() => {
    'timestamp': timestamp.toIso8601String(),
    'type': type,
    'result': result,
  };

  factory HistoryEntry.fromJson(Map<String, dynamic> json) => HistoryEntry(
    timestamp: DateTime.parse(json['timestamp'] as String),
    type: json['type'] as String,
    result: json['result'] as String,
  );
}

/// Service for saving and retrieving recognition history.
class HistoryService {
  static final HistoryService _instance = HistoryService._internal();
  factory HistoryService() => _instance;
  HistoryService._internal();

  static const String _key = 'recognition_history';
  static const int _maxEntries = 50;

  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  List<HistoryEntry> getHistory() {
    final raw = _prefs?.getString(_key);
    if (raw == null || raw.isEmpty) return [];

    try {
      final List<dynamic> jsonList = jsonDecode(raw) as List<dynamic>;
      return jsonList
          .map((e) => HistoryEntry.fromJson(e as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => b.timestamp.compareTo(a.timestamp)); // newest first
    } catch (_) {
      return [];
    }
  }

  Future<void> addEntry(String type, String result) async {
    if (result.trim().isEmpty) return;

    final entries = getHistory();
    entries.insert(
      0,
      HistoryEntry(timestamp: DateTime.now(), type: type, result: result),
    );

    // Trim to max entries
    final trimmed = entries.length > _maxEntries
        ? entries.sublist(0, _maxEntries)
        : entries;

    final jsonString = jsonEncode(trimmed.map((e) => e.toJson()).toList());
    await _prefs?.setString(_key, jsonString);
  }

  Future<void> clearHistory() async {
    await _prefs?.remove(_key);
  }
}
