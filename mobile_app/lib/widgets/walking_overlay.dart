import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';

/// Walking mode HUD overlay: FPS, nearest obstacle, safe direction,
/// pulsing border, detection chips, and bounding boxes.
class WalkingOverlay extends StatelessWidget {
  const WalkingOverlay({
    super.key,
    required this.isEnabled,
    required this.pulseController,
    required this.currentFps,
    required this.nearestObstacle,
    required this.safeDirection,
    required this.detections,
    required this.language,
    required this.topOffset,
    this.frameWidth,
    this.frameHeight,
  });

  final bool isEnabled;
  final AnimationController pulseController;
  final int currentFps;
  final String nearestObstacle;
  final String safeDirection;
  final List<Map<String, dynamic>> detections;
  final String language;
  final int? frameWidth;
  final int? frameHeight;

  final double topOffset;

  @override
  Widget build(BuildContext context) {
    if (!isEnabled) return const SizedBox.shrink();

    final topPadding = MediaQuery.of(context).padding.top;

    return Stack(
      children: [
        // Pulsing border
        Positioned.fill(
          child: AnimatedBuilder(
            animation: pulseController,
            builder: (context, child) {
              return Container(
                decoration: BoxDecoration(
                  border: Border.all(
                    color: AppTheme.accentCyan.withValues(
                      alpha: 0.1 + (pulseController.value * 0.4),
                    ),
                    width: 4 * pulseController.value,
                  ),
                ),
              );
            },
          ),
        ),

        // Bounding boxes
        if (detections.isNotEmpty && frameWidth != null && frameHeight != null)
          Positioned.fill(
            child: CustomPaint(
              painter: _DetectionPainter(
                detections: detections,
                frameWidth: frameWidth!,
                frameHeight: frameHeight!,
              ),
            ),
          ),

        // HUD Group (Status Card + Chips)
        Positioned(
          top: topPadding + topOffset,
          left: 16,
          right: 16,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status card
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: AppTheme.glassDecoration(
                  borderRadius: 12,
                  opacity: 0.65,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${language == 'vi' ? 'ĐI BỘ' : 'WALK'} - $currentFps FPS',
                      style: const TextStyle(
                        color: AppTheme.accentGreen,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${language == 'vi' ? 'Vật cản gần nhất' : 'Nearest'}: $nearestObstacle',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                    Text(
                      '${language == 'vi' ? 'Hướng an toàn' : 'Safe'}: $safeDirection',
                      style: const TextStyle(
                        color: AppTheme.accentCyan,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Detection chips
              if (detections.isNotEmpty)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: detections.take(6).map((d) { // Limit to 6 to prevent overfilling screen
                    final label = d['label']?.toString() ?? 'Object';
                    final distance = (d['distance'] as num?)?.toDouble();
                    final color = _getDistanceColor(distance);

                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.2),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              label.toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (distance != null) ...[
                            const SizedBox(width: 4),
                            Text(
                              '${distance.toStringAsFixed(1)}m',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  }).toList(),
                ),
            ],
          ),
        ),
      ],
    );
  }

  static Color _getDistanceColor(double? distance) {
    if (distance == null) return AppTheme.accentCyan;
    if (distance < 2.0) return AppTheme.accentRed;
    if (distance < 5.0) return AppTheme.accentOrange;
    return AppTheme.accentGreen;
  }
}

class _DetectionPainter extends CustomPainter {
  final List<Map<String, dynamic>> detections;
  final int frameWidth;
  final int frameHeight;

  _DetectionPainter({
    required this.detections,
    required this.frameWidth,
    required this.frameHeight,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final double scaleX = size.width / frameWidth;
    final double scaleY = size.height / frameHeight;

    for (final d in detections) {
      final box = d['box'] as List<dynamic>?;
      if (box == null || box.length < 4) continue;

      final label = d['label']?.toString() ?? '';
      final distance = (d['distance'] as num?)?.toDouble();

      final double left = box[0] * scaleX;
      final double top = box[1] * scaleY;
      final double right = box[2] * scaleX;
      final double bottom = box[3] * scaleY;

      final color = WalkingOverlay._getDistanceColor(distance);
      final paint = Paint()
        ..color = color.withValues(alpha: 0.8)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5;

      final rect = Rect.fromLTRB(left, top, right, bottom);
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(4)),
        paint,
      );

      final textPainter = TextPainter(
        text: TextSpan(
          text: '${label.toUpperCase()} ${distance?.toStringAsFixed(1) ?? ""}m'
              .trim(),
          style: TextStyle(
            color: Colors.white,
            fontSize: 10,
            fontWeight: FontWeight.bold,
            backgroundColor: color.withValues(alpha: 0.8),
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(left, top - textPainter.height));
    }
  }

  @override
  bool shouldRepaint(covariant _DetectionPainter oldDelegate) {
    return oldDelegate.detections != detections;
  }
}
