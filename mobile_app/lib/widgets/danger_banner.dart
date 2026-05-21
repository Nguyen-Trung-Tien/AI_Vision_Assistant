import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';

/// Danger/obstacle alert banner displayed at the top of the screen.
/// Uses AnimatedSlide + AnimatedOpacity for smooth entrance/exit transitions.
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
    final isDanger = dangerMessage != null;
    // displayMsg is non-null: walkingNearestObstacle is always String
    final displayMsg = dangerMessage ?? walkingNearestObstacle;

    Color bannerColor = AppTheme.accentRed;
    if (!isDanger && currentDetections.isNotEmpty) {
      final nearest = currentDetections.first;
      final dist = (nearest['distance'] as num?)?.toDouble();
      bannerColor = _getDistanceColor(dist);
    }

    // Animated entrance: slide from top + fade in
    return AnimatedSlide(
      offset: isVisible ? Offset.zero : const Offset(0, -0.3),
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
      child: AnimatedOpacity(
        opacity: isVisible ? 1.0 : 0.0,
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
        child: isVisible
            ? _buildContent(isDanger, displayMsg, bannerColor)
            : const SizedBox.shrink(),
      ),
    );
  }

  Widget _buildContent(bool isDanger, String displayMsg, Color bannerColor) {
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
          // Pulse icon for HIGH danger
          isDanger
              ? const _PulseIcon(color: Colors.white)
              : const Icon(
                  Icons.info_outline_rounded,
                  color: Colors.white,
                  size: 32,
                ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              displayMsg.toUpperCase(),
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

/// Pulsing warning icon for danger alerts — draws attention immediately.
class _PulseIcon extends StatefulWidget {
  final Color color;
  const _PulseIcon({required this.color});
  @override
  State<_PulseIcon> createState() => _PulseIconState();
}

class _PulseIconState extends State<_PulseIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 600),
  )..repeat(reverse: true);

  late final Animation<double> _scale = Tween<double>(
    begin: 0.85,
    end: 1.15,
  ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scale,
      child: Icon(
        Icons.warning_amber_rounded,
        color: widget.color,
        size: 32,
      ),
    );
  }
}
