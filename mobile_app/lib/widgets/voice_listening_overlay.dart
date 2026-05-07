import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';

class VoiceListeningOverlay extends StatefulWidget {
  const VoiceListeningOverlay({super.key});

  @override
  State<VoiceListeningOverlay> createState() => _VoiceListeningOverlayState();
}

class _VoiceListeningOverlayState extends State<VoiceListeningOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.75),
        child: Center(
          child: AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) {
              final scale = 1.0 + (_pulseController.value * 0.3);
              final opacity = 1.0 - (_pulseController.value * 0.5);

              return Stack(
                alignment: Alignment.center,
                children: [
                  // Outer ripple
                  Transform.scale(
                    scale: scale + 0.5,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.accentCyan.withValues(alpha: opacity * 0.2),
                      ),
                    ),
                  ),
                  // Inner ripple
                  Transform.scale(
                    scale: scale,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.accentCyan.withValues(alpha: opacity * 0.4),
                      ),
                    ),
                  ),
                  // Mic icon
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.accentCyan.withValues(alpha: 0.2),
                      border: Border.all(
                        color: AppTheme.accentCyan,
                        width: 2,
                      ),
                    ),
                    child: const Icon(
                      Icons.mic_rounded,
                      color: AppTheme.accentCyan,
                      size: 48,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
