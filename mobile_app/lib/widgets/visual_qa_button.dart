import 'dart:math';
import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';

/// Visual QA interaction states.
enum VisualQAState { idle, recording, processing }

class VisualQAButton extends StatefulWidget {
  final Future<void> Function(BuildContext context) onStartRecording;
  final Future<void> Function(BuildContext context) onStopRecording;
  final String language;

  const VisualQAButton({
    super.key,
    required this.onStartRecording,
    required this.onStopRecording,
    required this.language,
  });

  @override
  State<VisualQAButton> createState() => VisualQAButtonState();
}

class VisualQAButtonState extends State<VisualQAButton>
    with TickerProviderStateMixin {
  VisualQAState _state = VisualQAState.idle;

  // Pulse rings animation (recording)
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnim;

  // Rotating gradient border
  late final AnimationController _rotateController;

  // Scale bounce on press
  late final AnimationController _scaleController;
  late final Animation<double> _scaleAnim;

  // Icon crossfade
  late final AnimationController _iconController;

  // Soundwave bars
  late final AnimationController _waveController;

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _pulseAnim = Tween<double>(begin: 1.0, end: 1.6).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
    );

    _rotateController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    );

    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnim = Tween<double>(begin: 1.0, end: 0.88).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );

    _iconController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _rotateController.dispose();
    _scaleController.dispose();
    _iconController.dispose();
    _waveController.dispose();
    super.dispose();
  }

  void _startRecording() {
    if (_state != VisualQAState.idle) return;
    setState(() => _state = VisualQAState.recording);
    _pulseController.repeat();
    _rotateController.repeat();
    _waveController.repeat();
    _iconController.forward();
    _scaleController.forward().then((_) => _scaleController.reverse());
    widget.onStartRecording(context);
  }

  void _stopRecording() {
    if (_state != VisualQAState.recording) return;
    setState(() => _state = VisualQAState.processing);
    _pulseController.stop();
    _waveController.stop();
    _iconController.reverse();
    widget.onStopRecording(context).then((_) {
      if (mounted) {
        // Auto-return to idle after a timeout (result comes via TTS)
        Future.delayed(const Duration(seconds: 12), () {
          if (mounted && _state == VisualQAState.processing) {
            setIdle();
          }
        });
      }
    });
  }

  /// Called externally when AI result is received.
  void setIdle() {
    if (!mounted) return;
    setState(() => _state = VisualQAState.idle);
    _pulseController.stop();
    _pulseController.value = 0;
    _rotateController.stop();
    _waveController.stop();
    _iconController.value = 0;
  }

  @override
  Widget build(BuildContext context) {
    final isRecording = _state == VisualQAState.recording;
    final isProcessing = _state == VisualQAState.processing;
    final isActive = isRecording || isProcessing;

    return SizedBox(
      width: 120,
      height: 120,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // ── Ripple rings (recording only) ──
          if (isRecording)
            AnimatedBuilder(
              animation: _pulseAnim,
              builder: (context, _) => _buildRippleRings(_pulseAnim.value),
            ),

          // ── Rotating gradient border ──
          AnimatedBuilder(
            animation: _rotateController,
            builder: (context, child) {
              return Transform.rotate(
                angle: isActive ? _rotateController.value * 2 * pi : 0,
                child: child,
              );
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 400),
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: SweepGradient(
                  colors: isRecording
                      ? [
                          AppTheme.accentPink,
                          AppTheme.accentCyan,
                          AppTheme.accentPink,
                        ]
                      : isProcessing
                          ? [
                              AppTheme.accentCyan,
                              AppTheme.accentPurple,
                              AppTheme.accentCyan,
                            ]
                          : [
                              AppTheme.accentPurple,
                              AppTheme.accentCyan,
                              AppTheme.accentPurple,
                            ],
                ),
              ),
            ),
          ),

          // ── Inner button face ──
          GestureDetector(
            onPanDown: (_) => _startRecording(),
            onPanEnd: (_) => _stopRecording(),
            onPanCancel: () => _stopRecording(),
            child: AnimatedBuilder(
              animation: _scaleAnim,
              builder: (context, child) => Transform.scale(
                scale: _scaleAnim.value,
                child: child,
              ),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 74,
                height: 74,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isRecording
                      ? AppTheme.accentPink.withValues(alpha: 0.9)
                      : isProcessing
                          ? AppTheme.bgCard
                          : AppTheme.bgDark,
                  boxShadow: [
                    BoxShadow(
                      color: isRecording
                          ? AppTheme.accentPink.withValues(alpha: 0.6)
                          : isProcessing
                              ? AppTheme.accentCyan.withValues(alpha: 0.4)
                              : AppTheme.accentPurple.withValues(alpha: 0.3),
                      blurRadius: isActive ? 24 : 12,
                      spreadRadius: isActive ? 4 : 1,
                    ),
                  ],
                ),
                child: _buildInnerContent(),
              ),
            ),
          ),

          // ── Label ──
          Positioned(
            bottom: 4,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              opacity: isRecording ? 0.0 : 1.0,
              child: AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                style: TextStyle(
                  color: isProcessing
                      ? AppTheme.accentCyan
                      : Colors.white.withValues(alpha: 0.9),
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
                child: Text(
                  isProcessing
                      ? (widget.language == 'vi' ? 'Đang xử lý...' : 'Thinking...')
                      : (widget.language == 'vi' ? 'Hỏi AI' : 'Ask AI'),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRippleRings(double scale) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Ring 3 (outermost, faintest)
        Transform.scale(
          scale: scale + 0.2,
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.accentPink.withValues(alpha: 0.12),
                width: 1.5,
              ),
            ),
          ),
        ),
        // Ring 2
        Transform.scale(
          scale: scale * 0.85,
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.accentPink.withValues(alpha: 0.25),
                width: 2,
              ),
            ),
          ),
        ),
        // Ring 1 (closest, brightest)
        Transform.scale(
          scale: scale * 0.6,
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.accentPink.withValues(alpha: 0.08),
              border: Border.all(
                color: AppTheme.accentPink.withValues(alpha: 0.4),
                width: 2,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInnerContent() {
    if (_state == VisualQAState.processing) {
      return _buildProcessingSpinner();
    }

    if (_state == VisualQAState.recording) {
      return AnimatedBuilder(
        animation: _waveController,
        builder: (context, _) => _buildSoundWave(),
      );
    }

    // Idle: lightbulb icon with gentle shimmer
    return const Icon(
      Icons.auto_awesome,
      color: AppTheme.accentCyan,
      size: 30,
    );
  }

  Widget _buildSoundWave() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (i) {
        // Staggered phase for each bar
        final phase = (_waveController.value + i * 0.15) % 1.0;
        final height = 10.0 + sin(phase * pi * 2) * 12.0;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 80),
          margin: const EdgeInsets.symmetric(horizontal: 2),
          width: 4,
          height: height.clamp(6.0, 26.0),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.9),
            borderRadius: BorderRadius.circular(2),
          ),
        );
      }),
    );
  }

  Widget _buildProcessingSpinner() {
    return SizedBox(
      width: 32,
      height: 32,
      child: CircularProgressIndicator(
        strokeWidth: 2.5,
        valueColor: AlwaysStoppedAnimation<Color>(
          AppTheme.accentCyan.withValues(alpha: 0.9),
        ),
      ),
    );
  }
}
