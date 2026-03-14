import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';
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

  late List<HistoryEntry> _allEntries;
  List<HistoryEntry> _filtered = [];

  // --- Filter state ---
  final TextEditingController _searchCtrl = TextEditingController();
  String _selectedType =
      'all'; // 'all' | 'money' | 'text' | 'caption' | 'barcode'

  static const _types = ['all', 'money', 'text', 'caption', 'barcode'];

  @override
  void initState() {
    super.initState();
    _allEntries = _historyService.getHistory();
    _filtered = List.from(_allEntries);

    final lang = SettingsService().language;
    if (_allEntries.isEmpty) {
      _accessibility.speak(AppLocalizations.t('history_empty_tts', lang));
    } else {
      final msg1 = AppLocalizations.t('history_count_tts_1', lang);
      final msg2 = AppLocalizations.t('history_count_tts_2', lang);
      _accessibility.speak('$msg1 ${_allEntries.length} $msg2');
    }

    _searchCtrl.addListener(_applyFilter);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _applyFilter() {
    final query = _searchCtrl.text.trim().toLowerCase();
    setState(() {
      _filtered = _allEntries.where((e) {
        final typeMatch = _selectedType == 'all' || e.type == _selectedType;
        final textMatch =
            query.isEmpty || e.result.toLowerCase().contains(query);
        return typeMatch && textMatch;
      }).toList();
    });
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
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        backgroundColor: AppTheme.bgCard,
        elevation: 0,
        title: Text(
          AppLocalizations.t('history_title', lang),
          style: AppTheme.titleLarge,
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () {
            _accessibility.speak(AppLocalizations.t('back', lang));
            Navigator.pop(context);
          },
        ),
        actions: [
          if (_allEntries.isNotEmpty)
            IconButton(
              icon: const Icon(
                Icons.delete_outline_rounded,
                color: AppTheme.accentRed,
              ),
              onPressed: () async {
                await _historyService.clearHistory();
                setState(() {
                  _allEntries = [];
                  _filtered = [];
                });
                _accessibility.speak(
                  AppLocalizations.t('history_cleared', lang),
                );
              },
            ),
        ],
      ),
      body: Column(
        children: [
          // --- Search bar ---
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _searchCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: lang == 'vi' ? 'Tìm kiếm...' : 'Search...',
                hintStyle: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                ),
                prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.accentPurple),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.white54),
                        onPressed: () {
                          _searchCtrl.clear();
                          _applyFilter();
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppTheme.whiteAlpha(0.08),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppTheme.accentCyan),
                ),
              ),
            ),
          ),

          // --- Filter chips ---
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: _types.map((type) {
                final isSelected = _selectedType == type;
                final label = type == 'all'
                    ? (lang == 'vi' ? 'Tất cả' : 'All')
                    : _getTypeLabel(type, lang);
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(label),
                    selected: isSelected,
                    onSelected: (_) {
                      setState(() => _selectedType = type);
                      _applyFilter();
                    },
                    backgroundColor: AppTheme.whiteAlpha(0.08),
                    selectedColor: AppTheme.accentPurple.withValues(alpha: 0.4),
                    checkmarkColor: Colors.white,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppTheme.whiteAlpha(0.8),
                      fontWeight: isSelected
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                    side: BorderSide(
                      color: isSelected
                          ? AppTheme.accentPurple
                          : AppTheme.whiteAlpha(0.15),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // --- Results count ---
          if (_allEntries.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '${_filtered.length} ${lang == "vi" ? "kết quả" : "results"}',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.4),
                    fontSize: 12,
                  ),
                ),
              ),
            ),

          // --- List ---
          Expanded(
            child: _filtered.isEmpty
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
                    itemCount: _filtered.length,
                    itemBuilder: (context, index) {
                      final entry = _filtered[index];
                      return GestureDetector(
                        onTap: () {
                          _accessibility.speak(
                            '${_getTypeLabel(entry.type, lang)}: ${entry.result}',
                          );
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: AppTheme.cardDecoration(borderRadius: 14)
                              .copyWith(
                            color: AppTheme.bgCard.withValues(alpha: 0.9),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    _getTypeLabel(entry.type, lang),
                                    style: const TextStyle(
                                      color: AppTheme.accentCyan,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(
                                    _formatTime(entry.timestamp, lang),
                                    style: TextStyle(
                                      color: Colors.white.withValues(
                                        alpha: 0.4,
                                      ),
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
          ),
        ],
      ),
    );
  }
}
