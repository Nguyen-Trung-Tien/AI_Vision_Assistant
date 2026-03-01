import 'package:flutter/material.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/history_service.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final AccessibilityManager _accessibility = AccessibilityManager();
  final HistoryService _historyService = HistoryService();

  late List<HistoryEntry> _entries;

  @override
  void initState() {
    super.initState();
    _entries = _historyService.getHistory();
    final lang = SettingsService().language;

    if (_entries.isEmpty) {
      _accessibility.speak(AppLocalizations.t('history_empty_tts', lang));
    } else {
      final msg1 = AppLocalizations.t('history_count_tts_1', lang);
      final msg2 = AppLocalizations.t('history_count_tts_2', lang);
      _accessibility.speak('$msg1 ${_entries.length} $msg2');
    }
  }

  String _getTypeLabel(String type, String lang) {
    switch (type) {
      case 'money':
        return AppLocalizations.t('history_type_money', lang);
      case 'text':
        return AppLocalizations.t('history_type_text', lang);
      case 'caption':
        return AppLocalizations.t('history_type_caption', lang);
      case 'barcode':
        return AppLocalizations.t('history_type_barcode', lang);
      default:
        return AppLocalizations.t('history_type_default', lang);
    }
  }

  String _formatTime(DateTime dt, String lang) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) {
      return AppLocalizations.t('history_time_just_now', lang);
    }
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes} ${AppLocalizations.t('history_time_mins', lang)}';
    }
    if (diff.inHours < 24) {
      return '${diff.inHours} ${AppLocalizations.t('history_time_hours', lang)}';
    }
    return '${diff.inDays} ${AppLocalizations.t('history_time_days', lang)}';
  }

  @override
  Widget build(BuildContext context) {
    final lang = SettingsService().language;
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D2B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A4E),
        title: Text(
          AppLocalizations.t('history_title', lang),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white, size: 32),
          onPressed: () {
            _accessibility.speak(AppLocalizations.t('back', lang));
            Navigator.pop(context);
          },
        ),
        actions: [
          if (_entries.isNotEmpty)
            IconButton(
              icon: const Icon(
                Icons.delete_outline,
                color: Colors.redAccent,
                size: 28,
              ),
              onPressed: () async {
                await _historyService.clearHistory();
                setState(() => _entries = []);
                _accessibility.speak(
                  AppLocalizations.t('history_cleared', lang),
                );
              },
            ),
        ],
      ),
      body: _entries.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.history,
                    size: 80,
                    color: Colors.white.withValues(alpha: 0.2),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    AppLocalizations.t('history_no_results', lang),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _entries.length,
              itemBuilder: (context, index) {
                final entry = _entries[index];
                return GestureDetector(
                  onTap: () {
                    _accessibility.speak(
                      '${_getTypeLabel(entry.type, lang)}: ${entry.result}',
                    );
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              _getTypeLabel(entry.type, lang),
                              style: const TextStyle(
                                color: Color(0xFF00D4FF),
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              _formatTime(entry.timestamp, lang),
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.4),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          entry.result,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
