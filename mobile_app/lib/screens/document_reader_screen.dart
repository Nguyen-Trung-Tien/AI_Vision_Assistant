import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile_app/l10n/app_localizations.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/theme/app_theme.dart';

class DocumentReaderScreen extends StatefulWidget {
  final List<String> pages;
  final AccessibilityManager accessibilityManager;
  final String language;

  const DocumentReaderScreen({
    super.key,
    required this.pages,
    required this.accessibilityManager,
    required this.language,
  });

  @override
  State<DocumentReaderScreen> createState() => _DocumentReaderScreenState();
}

class _DocumentReaderScreenState extends State<DocumentReaderScreen> {
  late int _currentPage;
  final TextEditingController _textController = TextEditingController();
  TextSelection? _lastValidSelection;

  late Timer _speakingTimer;
  bool _isSpeaking = false;
  DateTime? _lastTapTime;

  @override
  void initState() {
    super.initState();
    _currentPage = 0;

    _textController.addListener(() {
      final sel = _textController.selection;
      if (sel.isValid && !sel.isCollapsed) {
        _lastValidSelection = sel;
      }
    });

    _updateText();

    // Announce the screen
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.pages.length > 1) {
        widget.accessibilityManager.speak(widget.language == 'vi'
            ? 'Đã mở tài liệu có ${widget.pages.length} trang. Đang ở trang 1.'
            : 'Opened document with ${widget.pages.length} pages. Currently on page 1.');
      } else {
        widget.accessibilityManager.speak(widget.language == 'vi'
            ? 'Đã mở tài liệu. Hãy chọn chức năng đọc.'
            : 'Opened document. Please select a reading option.');
      }
    });

    // Poll speaking status to update UI
    _speakingTimer = Timer.periodic(const Duration(milliseconds: 200), (_) {
      if (mounted && widget.accessibilityManager.isSpeaking != _isSpeaking) {
        setState(() {
          _isSpeaking = widget.accessibilityManager.isSpeaking;
        });
      }
    });
  }

  void _updateText() {
    // Sanitize text slightly for display
    _textController.text = widget.pages[_currentPage];
    _lastValidSelection = null;
  }

  void _nextPage() {
    if (_currentPage < widget.pages.length - 1) {
      setState(() {
        _currentPage++;
        _updateText();
      });
      widget.accessibilityManager.speak(widget.language == 'vi'
          ? 'Trang ${_currentPage + 1}'
          : 'Page ${_currentPage + 1}');
    }
  }

  void _prevPage() {
    if (_currentPage > 0) {
      setState(() {
        _currentPage--;
        _updateText();
      });
      widget.accessibilityManager.speak(widget.language == 'vi'
          ? 'Trang ${_currentPage + 1}'
          : 'Page ${_currentPage + 1}');
    }
  }

  void _readSelectedText() {
    var selection = _textController.selection;

    // Nếu TextField mất focus khi bấm nút, lấy lại vùng chọn trước đó
    if (!selection.isValid || selection.isCollapsed) {
      if (_lastValidSelection != null) {
        selection = _lastValidSelection!;
      }
    }

    if (selection.isValid && !selection.isCollapsed) {
      final selectedText = selection.textInside(_textController.text);
      widget.accessibilityManager.speak(selectedText);
    } else {
      widget.accessibilityManager.speak(widget.language == 'vi'
          ? 'Chưa có đoạn chữ nào được bôi đen'
          : 'No text highlighted');
    }
  }

  void _readCurrentPage() {
    widget.accessibilityManager.speak(_textController.text);
  }

  void _readAll() {
    final fullText = widget.pages.join('\n\n');
    widget.accessibilityManager.speak(fullText);
  }

  @override
  void dispose() {
    _speakingTimer.cancel();
    _textController.dispose();
    super.dispose();
  }

  void _handlePointerDown(PointerDownEvent event) {
    final now = DateTime.now();
    if (_lastTapTime != null &&
        now.difference(_lastTapTime!) < const Duration(milliseconds: 400)) {
      widget.accessibilityManager.stopSpeak();
      if (mounted) Navigator.pop(context);
    }
    _lastTapTime = now;
  }

  @override
  Widget build(BuildContext context) {
    final bool isVi = widget.language == 'vi';

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        backgroundColor: AppTheme.bgCard,
        title: Text(
          isVi ? 'Đọc Tài Liệu' : 'Document Reader',
          style: AppTheme.titleLarge.copyWith(fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () {
            widget.accessibilityManager
                .speak(AppLocalizations.t('back', widget.language));
            Navigator.pop(context);
          },
        ),
      ),
      body: Listener(
        behavior: HitTestBehavior.translucent,
        onPointerDown: _handlePointerDown,
        child: Column(
          children: [
            // Reading Indicator
            if (_isSpeaking)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 8),
                color: AppTheme.accentGreen.withValues(alpha: 0.2),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppTheme.accentGreen),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      isVi ? 'Đang đọc...' : 'Reading...',
                      style: AppTheme.bodyMedium.copyWith(
                          color: AppTheme.accentGreen,
                          fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),

            // Page navigation if multiple pages
            if (widget.pages.length > 1)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: AppTheme.bgCard.withValues(alpha: 0.5),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      onPressed: _currentPage > 0 ? _prevPage : null,
                      icon: Icon(
                        Icons.chevron_left_rounded,
                        color: _currentPage > 0
                            ? AppTheme.accentCyan
                            : Colors.white24,
                        size: 32,
                      ),
                      tooltip: isVi ? 'Trang trước' : 'Previous page',
                    ),
                    Text(
                      isVi
                          ? 'Trang ${_currentPage + 1} / ${widget.pages.length}'
                          : 'Page ${_currentPage + 1} of ${widget.pages.length}',
                      style: AppTheme.bodyLarge
                          .copyWith(fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      onPressed: _currentPage < widget.pages.length - 1
                          ? _nextPage
                          : null,
                      icon: Icon(
                        Icons.chevron_right_rounded,
                        color: _currentPage < widget.pages.length - 1
                            ? AppTheme.accentCyan
                            : Colors.white24,
                        size: 32,
                      ),
                      tooltip: isVi ? 'Trang sau' : 'Next page',
                    ),
                  ],
                ),
              ),

            // Main text area
            Expanded(
              child: Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.1),
                  ),
                ),
                child: TextField(
                  controller: _textController,
                  readOnly: true,
                  maxLines: null,
                  expands: true,
                  style: AppTheme.bodyMedium
                      .copyWith(fontSize: 16, height: 1.5, color: Colors.white),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                  ),
                ),
              ),
            ),

            // Action buttons
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _readSelectedText,
                          icon: const Icon(Icons.highlight_alt_rounded),
                          label: Text(
                            isVi ? 'Đọc đoạn bôi đen' : 'Read highlighted',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor:
                                AppTheme.accentPurple.withValues(alpha: 0.2),
                            foregroundColor: AppTheme.accentPurple,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: BorderSide(
                                  color: AppTheme.accentPurple
                                      .withValues(alpha: 0.5)),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _readCurrentPage,
                          icon: const Icon(Icons.menu_book_rounded),
                          label: Text(
                            isVi ? 'Đọc trang này' : 'Read page',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor:
                                AppTheme.accentCyan.withValues(alpha: 0.2),
                            foregroundColor: AppTheme.accentCyan,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: BorderSide(
                                  color: AppTheme.accentCyan
                                      .withValues(alpha: 0.5)),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (widget.pages.length > 1) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _readAll,
                        icon: const Icon(Icons.auto_stories_rounded),
                        label: Text(
                          isVi
                              ? 'Đọc TOÀN BỘ tài liệu'
                              : 'Read ENTIRE document',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor:
                              AppTheme.accentGreen.withValues(alpha: 0.2),
                          foregroundColor: AppTheme.accentGreen,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(
                                color: AppTheme.accentGreen
                                    .withValues(alpha: 0.5)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
