import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';

/// Circular SOS hold-to-trigger button with progress indicator.
class SosButton extends StatelessWidget {
  const SosButton({
    super.key,
    required this.holdProgress,
    required this.onLongPressStart,
    required this.onLongPressEnd,
    required this.onLongPressCancel,
  });

  final double holdProgress;
  final GestureLongPressStartCallback onLongPressStart;
  final GestureLongPressEndCallback onLongPressEnd;
  final VoidCallback onLongPressCancel;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPressStart: onLongPressStart,
      onLongPressEnd: onLongPressEnd,
      onLongPressCancel: onLongPressCancel,
      child: Container(
        width: 70,
        height: 70,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppTheme.accentRed,
              AppTheme.accentRed.withValues(alpha: 0.85),
            ],
          ),
          border: Border.all(color: Colors.white70, width: 2.5),
          boxShadow: [
            BoxShadow(
              color: AppTheme.accentRed.withValues(alpha: 0.6),
              blurRadius: 18,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            CircularProgressIndicator(
              value: holdProgress,
              strokeWidth: 4,
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
              backgroundColor: Colors.white24,
            ),
            const Text(
              'SOS',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
