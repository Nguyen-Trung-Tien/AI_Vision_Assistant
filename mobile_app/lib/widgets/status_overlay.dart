import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';

class StatusOverlay extends StatelessWidget {
  final bool isConnected;
  final bool isFlashOn;
  final bool isNightMode;
  final String onlineText;
  final String offlineText;
  final String nightText;
  final String flashText;

  const StatusOverlay({
    super.key,
    required this.isConnected,
    required this.isFlashOn,
    required this.isNightMode,
    required this.onlineText,
    required this.offlineText,
    required this.nightText,
    required this.flashText,
  });

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top + 12;
    return Stack(
      children: [
        Positioned(
          top: topPadding,
          left: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: AppTheme.glassDecoration(
              borderRadius: 20,
              opacity: 0.6,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isConnected
                        ? AppTheme.accentGreen
                        : AppTheme.accentRed,
                    boxShadow: [
                      BoxShadow(
                        color: (isConnected
                                ? AppTheme.accentGreen
                                : AppTheme.accentRed)
                            .withValues(alpha: 0.6),
                        blurRadius: 6,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  isConnected ? onlineText : offlineText,
                  style: AppTheme.bodySmall.copyWith(
                    color: AppTheme.whiteAlpha(0.9),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
        if (isFlashOn || isNightMode)
          Positioned(
            top: topPadding,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.accentOrange.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.accentOrange.withValues(alpha: 0.4),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isNightMode ? Icons.nights_stay : Icons.flashlight_on,
                    color: Colors.black,
                    size: 18,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isNightMode ? nightText : flashText,
                    style: const TextStyle(
                      color: Colors.black,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
