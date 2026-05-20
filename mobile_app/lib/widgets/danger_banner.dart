import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';

/// Danger/obstacle alert banner displayed at the top of the screen.
class DangerBanner extends StatelessWidget {
  const DangerBanner({
    super.key,
    required this.dangerMessage,
    required this.walkingNearestObstacle,
    required this.isWalkingModeEnabled,
    required this.currentDetections,
  });

  final String? dangerMessage;
  final String walkingNearestObstacle;
  final bool isWalkingModeEnabled;
  final List<Map<String, dynamic>> currentDetections;

  bool get isVisible =>
      dangerMessage != null ||
      (isWalkingModeEnabled && walkingNearestObstacle != '-');

  @override
  Widget build(BuildContext context) {
    if (!isVisible) return const SizedBox.shrink();

    final isDanger = dangerMessage != null;
    final displayMsg = dangerMessage ?? walkingNearestObstacle;

    Color bannerColor = AppTheme.accentRed;
    if (!isDanger && currentDetections.isNotEmpty) {
      final nearest = currentDetections.first;
      final dist = (nearest['distance'] as num?)?.toDouble();
      bannerColor = _getDistanceColor(dist);
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
      decoration: BoxDecoration(
        color: bannerColor.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white70, width: 2),
        boxShadow: [
          BoxShadow(
            color: bannerColor.withValues(alpha: 0.5),
            blurRadius: 20,
            spreadRadius: 4,
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(
            isDanger ? Icons.warning_amber_rounded : Icons.info_outline_rounded,
            color: Colors.white,
            size: 32,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              displayMsg!.toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Color _getDistanceColor(double? distance) {
    if (distance == null) return AppTheme.accentCyan;
    if (distance < 2.0) return AppTheme.accentRed;
    if (distance < 5.0) return AppTheme.accentOrange;
    return AppTheme.accentGreen;
  }
}
