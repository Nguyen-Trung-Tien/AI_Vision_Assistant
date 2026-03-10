import 'package:flutter/material.dart';

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
    return Stack(
      children: [
        Positioned(
          top: 50,
          left: 16,
          child: Row(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isConnected
                      ? const Color(0xFF00E676)
                      : const Color(0xFFFF5252),
                  boxShadow: [
                    BoxShadow(
                      color:
                          (isConnected
                                  ? const Color(0xFF00E676)
                                  : const Color(0xFFFF5252))
                              .withValues(alpha: 0.6),
                      blurRadius: 8,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                isConnected ? onlineText : offlineText,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),

        if (isFlashOn || isNightMode)
          Positioned(
            top: 50,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 10,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: Colors.amber.withValues(alpha: 0.8),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isNightMode ? Icons.nights_stay : Icons.flashlight_on,
                    color: Colors.black,
                    size: 16,
                  ),
                  const SizedBox(width: 4),
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
