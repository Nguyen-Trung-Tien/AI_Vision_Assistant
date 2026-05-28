import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';

class RecognitionOverlay extends StatelessWidget {
  const RecognitionOverlay({
    super.key,
    required this.isEnabled,
    required this.detections,
    required this.primaryDetection,
    required this.title,
    required this.subtitle,
    required this.frameWidth,
    required this.frameHeight,
    required this.topOffset,
    this.ttsStartOffset,
    this.ttsEndOffset,
  });

  final bool isEnabled;
  final List<Map<String, dynamic>> detections;
  final Map<String, dynamic>? primaryDetection;
  final String? title;
  final String? subtitle;
  final int? frameWidth;
  final int? frameHeight;
  final double topOffset;
  final int? ttsStartOffset;
  final int? ttsEndOffset;

  @override
  Widget build(BuildContext context) {
    final hasOverlayData =
        detections.isNotEmpty || (title != null && title!.trim().isNotEmpty);
    if (!isEnabled || !hasOverlayData) return const SizedBox.shrink();

    final topPadding = MediaQuery.of(context).padding.top;
    final primary =
        primaryDetection ?? (detections.isNotEmpty ? detections.first : null);
    final accent = _colorForDetection(primary);

    return Stack(
      children: [
        if (detections.isNotEmpty && frameWidth != null && frameHeight != null)
          Positioned.fill(
            child: CustomPaint(
              painter: _RecognitionPainter(
                detections: detections,
                primaryDetection: primary,
                frameWidth: frameWidth!,
                frameHeight: frameHeight!,
              ),
            ),
          ),
        Positioned(
          top: topPadding + topOffset,
          left: 16,
          right: 16,
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.55,
            ),
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: AppTheme.glassDecoration(
                  borderRadius: 18,
                  opacity: 0.78,
                ).copyWith(
                  border: Border.all(
                    color: accent.withValues(alpha: 0.45),
                    width: 1.4,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            color: accent,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: accent.withValues(alpha: 0.5),
                                blurRadius: 10,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildHighlightedText(
                            title?.trim().isNotEmpty == true
                                ? title!.trim()
                                : _labelForDetection(primary),
                          ),
                        ),
                      ],
                    ),
                    if (subtitle != null && subtitle!.trim().isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        subtitle!.trim(),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.92),
                          fontSize: 12,
                          height: 1.3,
                        ),
                      ),
                    ],
                    if (detections.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: detections.take(4).map((d) {
                          final chipColor = _colorForDetection(d);
                          return Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: chipColor.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(
                                color: chipColor.withValues(alpha: 0.45),
                              ),
                            ),
                            child: Text(
                              _labelForDetection(d),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHighlightedText(String text) {
    const baseStyle = TextStyle(
      color: Colors.white,
      fontSize: 16,
      fontWeight: FontWeight.w700,
    );

    if (ttsStartOffset == null ||
        ttsEndOffset == null ||
        ttsEndOffset! <= ttsStartOffset! ||
        ttsStartOffset! < 0 ||
        ttsEndOffset! > text.length) {
      return Text(
        text,
        maxLines: 20,
        overflow: TextOverflow.ellipsis,
        style: baseStyle,
      );
    }

    final start = ttsStartOffset!;
    final end = math.min(ttsEndOffset!, text.length);

    final preText = text.substring(0, start);
    final highlightText = text.substring(start, end);
    final postText = text.substring(end);

    return RichText(
      maxLines: 20,
      overflow: TextOverflow.ellipsis,
      text: TextSpan(
        style: baseStyle,
        children: [
          TextSpan(text: preText),
          TextSpan(
            text: highlightText,
            style: baseStyle.copyWith(
              color: AppTheme.accentCyan,
              backgroundColor: AppTheme.accentCyan.withValues(alpha: 0.2),
            ),
          ),
          TextSpan(
            text: postText,
            style: baseStyle,
          ),
        ],
      ),
    );
  }

  static String _labelForDetection(Map<String, dynamic>? detection) {
    if (detection == null) return 'Object';
    return detection['display_name']?.toString() ??
        detection['label']?.toString() ??
        'Object';
  }

  static Color _colorForDetection(Map<String, dynamic>? detection) {
    final category = detection?['category']?.toString().toLowerCase() ?? '';
    if (category == 'money') return AppTheme.accentGreen;
    if (category == 'qr') return AppTheme.accentOrange;
    if (category == 'person') return Colors.tealAccent;
    return AppTheme.accentCyan;
  }
}

class _RecognitionPainter extends CustomPainter {
  const _RecognitionPainter({
    required this.detections,
    required this.primaryDetection,
    required this.frameWidth,
    required this.frameHeight,
  });

  final List<Map<String, dynamic>> detections;
  final Map<String, dynamic>? primaryDetection;
  final int frameWidth;
  final int frameHeight;

  @override
  void paint(Canvas canvas, Size size) {
    final sourceWidth = frameWidth.toDouble();
    final sourceHeight = frameHeight.toDouble();
    if (sourceWidth <= 0 || sourceHeight <= 0) return;

    final scale =
        math.max(size.width / sourceWidth, size.height / sourceHeight);
    final fittedWidth = sourceWidth * scale;
    final fittedHeight = sourceHeight * scale;
    final dx = (size.width - fittedWidth) / 2;
    final dy = (size.height - fittedHeight) / 2;

    for (final detection in detections) {
      final box = detection['box'] as List<dynamic>?;
      if (box == null || box.length < 4) continue;

      final left = dx + (box[0] as num).toDouble() * scale;
      final top = dy + (box[1] as num).toDouble() * scale;
      final right = dx + (box[2] as num).toDouble() * scale;
      final bottom = dy + (box[3] as num).toDouble() * scale;
      final rect = Rect.fromLTRB(left, top, right, bottom);
      final isPrimary = identical(detection, primaryDetection) ||
          (primaryDetection != null &&
              detection['box'].toString() ==
                  primaryDetection!['box'].toString());

      final color = RecognitionOverlay._colorForDetection(detection);
      final paint = Paint()
        ..color = color.withValues(alpha: isPrimary ? 0.98 : 0.72)
        ..style = PaintingStyle.stroke
        ..strokeWidth = isPrimary ? 3 : 2;

      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(8)),
        paint,
      );

      final label = RecognitionOverlay._labelForDetection(detection);
      final labelPainter = TextPainter(
        text: TextSpan(
          text: label,
          style: TextStyle(
            color: Colors.white,
            fontSize: isPrimary ? 12 : 11,
            fontWeight: FontWeight.w700,
            backgroundColor: color.withValues(alpha: isPrimary ? 0.92 : 0.75),
          ),
        ),
        maxLines: 1,
        ellipsis: '...',
        textDirection: TextDirection.ltr,
      )..layout(maxWidth: math.max(0, rect.width));

      final labelTop = math
          .max(
            0.0,
            top - labelPainter.height - 4,
          )
          .toDouble();
      labelPainter.paint(canvas, Offset(left, labelTop));
    }
  }

  @override
  bool shouldRepaint(covariant _RecognitionPainter oldDelegate) {
    return oldDelegate.detections != detections ||
        oldDelegate.primaryDetection != primaryDetection ||
        oldDelegate.frameWidth != frameWidth ||
        oldDelegate.frameHeight != frameHeight;
  }
}
