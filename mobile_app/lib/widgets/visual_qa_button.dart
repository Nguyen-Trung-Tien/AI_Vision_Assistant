import 'package:flutter/material.dart';

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
  State<VisualQAButton> createState() => _VisualQAButtonState();
}

class _VisualQAButtonState extends State<VisualQAButton> with SingleTickerProviderStateMixin {
  bool _isRecording = false;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _handlePanDown(DragDownDetails details) {
    if (_isRecording) return;
    setState(() => _isRecording = true);
    _pulseController.repeat(reverse: true);
    widget.onStartRecording(context);
  }

  void _handlePanEnd(DragEndDetails details) {
    if (!_isRecording) return;
    setState(() => _isRecording = false);
    _pulseController.stop();
    _pulseController.value = 0.0;
    widget.onStopRecording(context);
  }

  void _handlePanCancel() {
    if (!_isRecording) return;
    setState(() => _isRecording = false);
    _pulseController.stop();
    _pulseController.value = 0.0;
    widget.onStopRecording(context);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanDown: _handlePanDown,
      onPanEnd: _handlePanEnd,
      onPanCancel: _handlePanCancel,
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _isRecording ? _pulseAnimation.value : 1.0,
            child: Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isRecording ? Colors.deepPurpleAccent : const Color(0xFF6C63FF),
                border: Border.all(color: Colors.white70, width: 2),
                boxShadow: _isRecording
                    ? [
                        BoxShadow(
                          color: Colors.deepPurpleAccent.withValues(alpha: 0.8),
                          blurRadius: 20,
                          spreadRadius: 8,
                        )
                      ]
                    : [
                        BoxShadow(
                          color: const Color(0xFF6C63FF).withValues(alpha: 0.5),
                          blurRadius: 10,
                          spreadRadius: 2,
                        )
                      ],
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                   Icon(
                    _isRecording ? Icons.mic : Icons.lightbulb,
                    color: Colors.white,
                    size: 32,
                  ),
                  if (!_isRecording)
                    Positioned(
                      bottom: 8,
                      child: Text(
                        widget.language == 'vi' ? 'Hỏi AI' : 'Ask AI',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
