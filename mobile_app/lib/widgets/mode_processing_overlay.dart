import 'dart:math';
import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';

class ModeProcessingOverlay extends StatefulWidget {
  final String? mode;
  final String statusText;
  final bool isSpeaking;
  const ModeProcessingOverlay({
    super.key,
    this.mode,
    required this.statusText,
    this.isSpeaking = false,
  });

  @override
  State<ModeProcessingOverlay> createState() => _ModeProcessingOverlayState();
}

class _ModeProcessingOverlayState extends State<ModeProcessingOverlay>
    with TickerProviderStateMixin {
  late final AnimationController _p =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 2400))..repeat();
  late final AnimationController _s =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1600))
        ..repeat(reverse: true);
  late final AnimationController _wave =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 800))..repeat();

  @override
  void dispose() { _p.dispose(); _s.dispose(); _wave.dispose(); super.dispose(); }

  static const _modeColors = {
    'money': Color(0xFFFFD700),
    'caption': Color(0xFF42A5F5),
    'face': Color(0xFF26C6DA),
    'online_ocr': Color(0xFF00D4FF),
    'offline_ocr': Color(0xFF00E676),
    'file_read': Color(0xFFFF9800),
    'layout_analysis': Color(0xFFFF6B9D),
  };
  static const _modeIcons = {
    'money': Icons.auto_awesome,
    'caption': Icons.landscape,
    'face': Icons.face_retouching_natural_rounded,
    'online_ocr': Icons.text_fields,
    'offline_ocr': Icons.document_scanner,
    'file_read': Icons.folder_open,
    'layout_analysis': Icons.list_alt_rounded,
  };

  Color get _color => _modeColors[widget.mode] ?? AppTheme.accentCyan;
  IconData get _icon => _modeIcons[widget.mode] ?? Icons.auto_awesome;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withValues(alpha: 0.55),
      child: AnimatedBuilder(
        animation: Listenable.merge([_p, _s, _wave]),
        builder: (context, _) => Stack(
          children: [
            Positioned.fill(child: CustomPaint(painter: _buildPainter())),
            Center(child: _card()),
          ],
        ),
      ),
    );
  }

  CustomPainter _buildPainter() {
    if (widget.isSpeaking) return _SpeakingWavePainter(_wave.value, _color);
    final t = _p.value, t2 = _s.value;
    switch (widget.mode) {
      case 'money':       return _MoneyPainter(t, t2);
      case 'caption':     return _CaptionPainter(t, t2);
      case 'face':        return _FacePainter(t, t2);
      case 'online_ocr':  return _OnlineOCRPainter(t, t2);
      case 'offline_ocr': return _OfflineOCRPainter(t, t2);
      case 'file_read':   return _FileReadPainter(t, t2);
      case 'layout_analysis': return _LayoutPainter(t, t2);
      default: return _GenericPainter(t);
    }
  }

  Widget _card() {
    final c = _color;
    final pulse = sin(_p.value * pi * 2);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 48),
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 28),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: c.withValues(alpha: 0.3 + 0.2 * pulse), width: 1.5),
        boxShadow: [BoxShadow(color: c.withValues(alpha: 0.15 + 0.1 * pulse), blurRadius: 30, spreadRadius: 2)],
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Transform.scale(
          scale: 1.0 + 0.08 * sin(_s.value * pi),
          child: Container(
            width: 56, height: 56,
            decoration: BoxDecoration(
              color: c.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: c.withValues(alpha: 0.3)),
            ),
            child: Icon(
              widget.isSpeaking ? Icons.volume_up_rounded : _icon,
              color: c, size: 30,
            ),
          ),
        ),
        const SizedBox(height: 18),
        // Waveform or progress bar
        if (widget.isSpeaking)
          _buildWaveform(c)
        else
          SizedBox(
            width: 160, height: 3,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: LinearProgressIndicator(value: null, backgroundColor: Colors.white.withValues(alpha: 0.1), color: c),
            ),
          ),
        const SizedBox(height: 14),
        Text(widget.statusText, textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 16, fontWeight: FontWeight.w500)),
      ]),
    );
  }

  Widget _buildWaveform(Color c) {
    return SizedBox(
      width: 160, height: 28,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(12, (i) {
          final h = 8.0 + 16 * sin(_wave.value * pi * 2 + i * 0.5).abs();
          return AnimatedContainer(
            duration: const Duration(milliseconds: 80),
            margin: const EdgeInsets.symmetric(horizontal: 2),
            width: 4,
            height: h,
            decoration: BoxDecoration(
              color: c.withValues(alpha: 0.6 + 0.3 * sin(_wave.value * pi * 2 + i)),
              borderRadius: BorderRadius.circular(2),
            ),
          );
        }),
      ),
    );
  }
}

// ── Speaking wave: ripple from center with mode color ────────────────────
class _SpeakingWavePainter extends CustomPainter {
  final double t;
  final Color color;
  _SpeakingWavePainter(this.t, this.color);
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    for (int i = 0; i < 5; i++) {
      final phase = (t + i * 0.2) % 1.0;
      final r = phase * size.width * 0.5;
      final a = (0.15 * (1.0 - phase)).clamp(0.0, 0.15);
      canvas.drawCircle(center, r, Paint()..color = color.withValues(alpha: a)..style = PaintingStyle.stroke..strokeWidth = 2);
    }
    // Sound wave lines
    for (int i = 0; i < 8; i++) {
      final y = size.height * (0.2 + i * 0.08);
      final amp = 20.0 * sin(t * pi * 2 + i * 0.7);
      final path = Path()..moveTo(0, y);
      for (double x = 0; x <= size.width; x += 4) {
        path.lineTo(x, y + amp * sin(x / size.width * pi * 4 + t * pi * 6));
      }
      canvas.drawPath(path, Paint()..color = color.withValues(alpha: 0.06)..style = PaintingStyle.stroke..strokeWidth = 1);
    }
  }
  @override
  bool shouldRepaint(covariant CustomPainter o) => true;
}

// ── Money: Golden coin ripples ──────────────────────────────────────────
class _MoneyPainter extends CustomPainter {
  final double t, t2;
  _MoneyPainter(this.t, this.t2);
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    const color = Color(0xFFFFD700);
    for (int i = 0; i < 4; i++) {
      final r = 50.0 + i * 40 + 30 * sin(t * pi * 2 + i * 0.7);
      final a = (0.2 - i * 0.04).clamp(0.03, 0.2);
      canvas.drawCircle(center, r, Paint()..color = color.withValues(alpha: a)..style = PaintingStyle.stroke..strokeWidth = 2);
    }
    final rng = Random(42);
    for (int i = 0; i < 8; i++) {
      final angle = t * pi * 2 + i * pi / 4;
      final dist = 80.0 + rng.nextDouble() * 60 + 15 * sin(t * pi * 4 + i);
      final p = center + Offset(cos(angle) * dist, sin(angle) * dist);
      canvas.drawCircle(p, 3, Paint()..color = color.withValues(alpha: (0.3 + 0.3 * sin(t * pi * 3 + i)).clamp(0.0, 0.6)));
    }
    _corners(canvas, size, color.withValues(alpha: 0.4));
  }
  @override
  bool shouldRepaint(covariant CustomPainter o) => true;
}

// ── Caption: Camera viewfinder + scan wave ──────────────────────────────
class _CaptionPainter extends CustomPainter {
  final double t, t2;
  _CaptionPainter(this.t, this.t2);
  @override
  void paint(Canvas canvas, Size size) {
    const color = Color(0xFF42A5F5);
    final center = Offset(size.width / 2, size.height / 2);
    for (int i = 0; i < 3; i++) {
      final phase = (t + i * 0.33) % 1.0;
      final r = phase * size.width * 0.6;
      canvas.drawCircle(center, r, Paint()..color = color.withValues(alpha: (0.25 * (1.0 - phase)).clamp(0.0, 0.25))..style = PaintingStyle.stroke..strokeWidth = 1.5);
    }
    final cp = Paint()..color = color.withValues(alpha: 0.3)..strokeWidth = 1;
    canvas.drawLine(Offset(center.dx, center.dy - 40), Offset(center.dx, center.dy + 40), cp);
    canvas.drawLine(Offset(center.dx - 40, center.dy), Offset(center.dx + 40, center.dy), cp);
    _corners(canvas, size, color.withValues(alpha: 0.5));
  }
  @override
  bool shouldRepaint(covariant CustomPainter o) => true;
}

// ── Face: Oval + scan dots ──────────────────────────────────────────────
class _FacePainter extends CustomPainter {
  final double t, t2;
  _FacePainter(this.t, this.t2);
  @override
  void paint(Canvas canvas, Size size) {
    const color = Color(0xFF26C6DA);
    final cx = size.width / 2, cy = size.height / 2;
    canvas.drawOval(Rect.fromCenter(center: Offset(cx, cy), width: 120, height: 160),
      Paint()..color = color.withValues(alpha: 0.15 + 0.1 * sin(t * pi * 2))..style = PaintingStyle.stroke..strokeWidth = 2);
    final scanY = cy - 80 + 160 * t;
    canvas.drawLine(Offset(cx - 60, scanY), Offset(cx + 60, scanY),
      Paint()..color = color.withValues(alpha: 0.5)..strokeWidth = 1.5);
    for (final f in [Offset(cx - 20, cy - 25), Offset(cx + 20, cy - 25), Offset(cx, cy + 5), Offset(cx, cy + 30)]) {
      if (f.dy > scanY) continue;
      canvas.drawCircle(f, 4, Paint()..color = color.withValues(alpha: (0.5 * (1.0 - (scanY - f.dy) / 160)).clamp(0.1, 0.5)));
    }
    _corners(canvas, size, color.withValues(alpha: 0.4));
  }
  @override
  bool shouldRepaint(covariant CustomPainter o) => true;
}

// ── Online OCR: Laser + text lines ──────────────────────────────────────
class _OnlineOCRPainter extends CustomPainter {
  final double t, t2;
  _OnlineOCRPainter(this.t, this.t2);
  @override
  void paint(Canvas canvas, Size size) {
    final laserY = size.height * (0.15 + 0.7 * t);
    canvas.drawRect(Rect.fromLTWH(0, laserY, size.width, 2), Paint()
      ..shader = LinearGradient(colors: [Colors.transparent, AppTheme.accentCyan.withValues(alpha: 0.8), Colors.transparent],
        stops: const [0, 0.5, 1]).createShader(Rect.fromLTWH(0, laserY - 1, size.width, 2)));
    canvas.drawRect(Rect.fromLTWH(0, laserY - 30, size.width, 60), Paint()
      ..shader = LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
        colors: [Colors.transparent, AppTheme.accentCyan.withValues(alpha: 0.08), Colors.transparent])
        .createShader(Rect.fromLTWH(0, laserY - 30, size.width, 60)));
    final rng = Random(42);
    final lp = Paint()..strokeWidth = 1.5..strokeCap = StrokeCap.round;
    for (int i = 0; i < 12; i++) {
      final y = size.height * (0.1 + i * 0.065);
      if (y > laserY) continue;
      lp.color = AppTheme.accentCyan.withValues(alpha: (1.0 - (laserY - y) / size.height).clamp(0.05, 0.3));
      canvas.drawLine(Offset(size.width * (0.08 + rng.nextDouble() * 0.1), y),
        Offset(size.width * (0.5 + rng.nextDouble() * 0.4), y), lp);
    }
    _corners(canvas, size, AppTheme.accentCyan.withValues(alpha: 0.4));
  }
  @override
  bool shouldRepaint(covariant CustomPainter o) => true;
}

// ── Offline OCR: Dot matrix + beam ──────────────────────────────────────
class _OfflineOCRPainter extends CustomPainter {
  final double t, t2;
  _OfflineOCRPainter(this.t, this.t2);
  @override
  void paint(Canvas canvas, Size size) {
    final gp = Paint()..color = AppTheme.accentGreen.withValues(alpha: 0.06)..strokeWidth = 0.5;
    for (double x = 0; x < size.width; x += 40) canvas.drawLine(Offset(x, 0), Offset(x, size.height), gp);
    for (double y = 0; y < size.height; y += 40) canvas.drawLine(Offset(0, y), Offset(size.width, y), gp);
    final beamX = size.width * t;
    canvas.drawRect(Rect.fromLTWH(beamX - 1.5, 0, 3, size.height), Paint()
      ..shader = LinearGradient(colors: [Colors.transparent, AppTheme.accentGreen.withValues(alpha: 0.5), Colors.transparent])
        .createShader(Rect.fromLTWH(beamX - 20, 0, 40, size.height)));
    final rng = Random(7);
    final dp = Paint()..style = PaintingStyle.fill;
    for (int r = 0; r < 18; r++) for (int c = 0; c < 10; c++) {
      final dx = size.width * (0.1 + c * 0.085), dy = size.height * (0.12 + r * 0.045);
      if (dx > beamX || rng.nextDouble() > 0.6) continue;
      dp.color = AppTheme.accentGreen.withValues(alpha: 0.1 + 0.25 * ((beamX - dx) / size.width).clamp(0.0, 1.0));
      canvas.drawCircle(Offset(dx, dy), 2, dp);
    }
    _corners(canvas, size, AppTheme.accentGreen.withValues(alpha: 0.4));
  }
  @override
  bool shouldRepaint(covariant CustomPainter o) => true;
}

// ── File Read: Page + text cascade ──────────────────────────────────────
class _FileReadPainter extends CustomPainter {
  final double t, t2;
  _FileReadPainter(this.t, this.t2);
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2, cy = size.height / 2;
    const color = Color(0xFFFF9800);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(cx, cy), width: size.width * 0.55, height: size.height * 0.45), const Radius.circular(8)),
      Paint()..color = color.withValues(alpha: 0.06));
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(cx, cy), width: size.width * 0.55, height: size.height * 0.45), const Radius.circular(8)),
      Paint()..color = color.withValues(alpha: 0.2)..style = PaintingStyle.stroke..strokeWidth = 1);
    final rng = Random(99);
    final lp = Paint()..strokeWidth = 2..strokeCap = StrokeCap.round;
    final top = cy - size.height * 0.2;
    for (int i = 0; i < 14; i++) {
      final prog = ((t * 16 - i) / 2).clamp(0.0, 1.0);
      if (prog <= 0) continue;
      final y = top + i * 18, xs = cx - size.width * 0.22;
      lp.color = color.withValues(alpha: prog * 0.35);
      canvas.drawLine(Offset(xs, y), Offset(xs + size.width * (0.2 + rng.nextDouble() * 0.22) * prog, y), lp);
    }
    final fy = top + size.height * 0.4 * t;
    canvas.drawRect(Rect.fromLTWH(cx - size.width * 0.25, fy - 15, size.width * 0.5, 30), Paint()
      ..shader = LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
        colors: [Colors.transparent, color.withValues(alpha: 0.12), Colors.transparent])
        .createShader(Rect.fromLTWH(cx - size.width * 0.25, fy - 15, size.width * 0.5, 30)));
  }
  @override
  bool shouldRepaint(covariant CustomPainter o) => true;
}

// ── Layout Analysis ─────────────────────────────────────────────────────
class _LayoutPainter extends CustomPainter {
  final double t, t2;
  _LayoutPainter(this.t, this.t2);
  @override
  void paint(Canvas canvas, Size size) {
    const c = AppTheme.accentPink;
    final sections = [
      Rect.fromLTWH(size.width * 0.08, size.height * 0.1, size.width * 0.84, size.height * 0.08),
      Rect.fromLTWH(size.width * 0.08, size.height * 0.22, size.width * 0.4, size.height * 0.35),
      Rect.fromLTWH(size.width * 0.52, size.height * 0.22, size.width * 0.4, size.height * 0.15),
      Rect.fromLTWH(size.width * 0.52, size.height * 0.4, size.width * 0.4, size.height * 0.17),
      Rect.fromLTWH(size.width * 0.08, size.height * 0.62, size.width * 0.84, size.height * 0.12),
      Rect.fromLTWH(size.width * 0.08, size.height * 0.78, size.width * 0.55, size.height * 0.1),
    ];
    final bp = Paint()..style = PaintingStyle.stroke..strokeWidth = 1.5;
    final fp = Paint()..style = PaintingStyle.fill;
    for (int i = 0; i < sections.length; i++) {
      final sp = ((t * (sections.length + 2) - i) / 2).clamp(0.0, 1.0);
      if (sp <= 0) continue;
      final rr = RRect.fromRectAndRadius(sections[i], const Radius.circular(6));
      fp.color = c.withValues(alpha: 0.04 * sp);
      canvas.drawRRect(rr, fp);
      bp.color = c.withValues(alpha: (0.2 + 0.15 * sin(t2 * pi + i * 0.8)) * sp);
      canvas.drawRRect(rr, bp);
      if (sp > 0.5) canvas.drawCircle(Offset(sections[i].left + 8, sections[i].top + 8), 3, Paint()..color = c.withValues(alpha: 0.6 * sp));
    }
    canvas.drawRect(Rect.fromLTWH(0, size.height * t, size.width, 1.5), Paint()
      ..shader = LinearGradient(colors: [Colors.transparent, c.withValues(alpha: 0.4), Colors.transparent])
        .createShader(Rect.fromLTWH(0, size.height * t - 1, size.width, 2)));
  }
  @override
  bool shouldRepaint(covariant CustomPainter o) => true;
}

class _GenericPainter extends CustomPainter {
  final double t;
  _GenericPainter(this.t);
  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height / 2);
    for (int i = 0; i < 3; i++) {
      canvas.drawCircle(c, 40.0 + i * 30 + 20 * sin(t * pi * 2 + i),
        Paint()..color = AppTheme.accentCyan.withValues(alpha: 0.08 - i * 0.02)..style = PaintingStyle.stroke..strokeWidth = 1.5);
    }
  }
  @override
  bool shouldRepaint(covariant CustomPainter o) => true;
}

void _corners(Canvas canvas, Size size, Color color) {
  final p = Paint()..color = color..strokeWidth = 2..style = PaintingStyle.stroke..strokeCap = StrokeCap.round;
  const l = 28.0, m = 24.0;
  canvas.drawLine(Offset(m, m), Offset(m + l, m), p);
  canvas.drawLine(Offset(m, m), Offset(m, m + l), p);
  canvas.drawLine(Offset(size.width - m, m), Offset(size.width - m - l, m), p);
  canvas.drawLine(Offset(size.width - m, m), Offset(size.width - m, m + l), p);
  canvas.drawLine(Offset(m, size.height - m), Offset(m + l, size.height - m), p);
  canvas.drawLine(Offset(m, size.height - m), Offset(m, size.height - m - l), p);
  canvas.drawLine(Offset(size.width - m, size.height - m), Offset(size.width - m - l, size.height - m), p);
  canvas.drawLine(Offset(size.width - m, size.height - m), Offset(size.width - m, size.height - m - l), p);
}
