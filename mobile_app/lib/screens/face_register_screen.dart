import 'dart:convert';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/face_service.dart';
import 'package:mobile_app/services/ml_kit_service.dart';
import 'package:mobile_app/services/websocket_service.dart';
import 'package:mobile_app/theme/app_theme.dart';

class FaceRegisterScreen extends StatefulWidget {
  final WebSocketService? wsService;
  final List<CameraDescription>? cameras;

  const FaceRegisterScreen({super.key, this.wsService, this.cameras});

  @override
  State<FaceRegisterScreen> createState() => _FaceRegisterScreenState();
}

class _FaceRegisterScreenState extends State<FaceRegisterScreen> {
  late CameraController _controller;
  late Future<void> _initializeControllerFuture;
  final TextEditingController _nameController = TextEditingController();
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final MlKitService _mlKitService = MlKitService();
  bool _isRegistering = false;
  String _registrationStep = '';
  bool _isCameraReady = false;
  bool _isFrontCamera = true;
  List<dynamic> _registeredFaces = [];
  bool _isLoadingFaces = true;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    _loadRegisteredFaces();
    _setupWebSocketListener();
    _accessibilityManager.speak(
      'Màn hình đăng ký khuôn mặt. Vui lòng nhập tên và đưa khuôn mặt vào giữa khung hình.',
    );
  }

  void _setupWebSocketListener() {
    final ws = widget.wsService;
    if (ws == null) return;

    ws.onFaceRegistered = (data) {
      if (!mounted) return;
      final success = data['success'] == true;
      final name = data['name'] ?? '';

      if (success) {
        _accessibilityManager.speak(
          'Đã đăng ký thành công khuôn mặt của $name.',
        );
        _accessibilityManager.triggerSuccessVibration();
        _loadRegisteredFaces();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đăng ký thành công: $name'),
            backgroundColor: AppTheme.accentGreen,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        final message = data['message'] ?? 'Không phát hiện khuôn mặt';
        _accessibilityManager.speak('Lỗi đăng ký: $message');
        _accessibilityManager.triggerErrorVibration();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ $message'),
            backgroundColor: AppTheme.accentRed,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }

      if (mounted) setState(() => _isRegistering = false);
    };
  }

  Future<void> _loadRegisteredFaces() async {
    try {
      final faces = await FaceService.listFaces();
      if (mounted) {
        setState(() {
          _registeredFaces = faces;
          _isLoadingFaces = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading faces: $e');
      if (mounted) setState(() => _isLoadingFaces = false);
    }
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = widget.cameras ?? await availableCameras();
      if (cameras.isEmpty) return;

      final targetDirection = _isFrontCamera
          ? CameraLensDirection.front
          : CameraLensDirection.back;

      final camera = cameras.firstWhere(
        (camera) => camera.lensDirection == targetDirection,
        orElse: () => cameras.first,
      );

      _controller = CameraController(
        camera,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      _initializeControllerFuture = _controller.initialize();
      await _initializeControllerFuture;

      if (mounted) {
        setState(() => _isCameraReady = true);
      }
    } catch (e) {
      debugPrint('Camera error: $e');
      _accessibilityManager.speak(
        _isFrontCamera
            ? 'Không thể khởi động camera trước. Hãy thử chuyển lại camera sau.'
            : 'Không thể khởi động camera. Tài nguyên camera đang bị chiếm dụng.',
      );
    }
  }

  Future<void> _toggleCamera() async {
    if (_isRegistering) return;

    setState(() {
      _isCameraReady = false;
      _isFrontCamera = !_isFrontCamera;
    });

    await _controller.dispose();
    await _initializeCamera();

    final msg = _isFrontCamera
        ? 'Đã chuyển sang camera trước'
        : 'Đã chuyển sang camera sau';
    _accessibilityManager.speak(msg);
  }

  @override
  void dispose() {
    _controller.dispose();
    _nameController.dispose();
    _mlKitService.dispose();
    // Clean up WS listener
    final ws = widget.wsService;
    if (ws != null) ws.onFaceRegistered = null;
    super.dispose();
  }

  Future<void> _register() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      _accessibilityManager.speak('Vui lòng nhập tên người cần đăng ký.');
      return;
    }

    setState(() {
      _isRegistering = true;
      _registrationStep = 'Bắt đầu đăng ký';
    });
    _accessibilityManager.speak('Bắt đầu quá trình đăng ký khuôn mặt.');

    try {
      if (mounted) {
        setState(() => _registrationStep = 'Đang chụp ảnh...');
        _accessibilityManager.speak('Bước 1: Đang chụp ảnh.');
      }

      await _initializeControllerFuture;
      final image = await _controller.takePicture();

      if (mounted) {
        setState(() => _registrationStep = 'Đang kiểm tra khuôn mặt...');
        _accessibilityManager.speak('Bước 2: Đang kiểm tra khuôn mặt cục bộ.');
      }

      // Verify face presence locally first
      final faces = await _mlKitService.detectFaces(image.path);
      if (faces.isEmpty) {
        _accessibilityManager.speak(
          'Lỗi: Không tìm thấy khuôn mặt trong ảnh. Hãy thử lại.',
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Lỗi: Không tìm thấy khuôn mặt. Hãy nhìn thẳng vào camera.',
              ),
              backgroundColor: Colors.red,
            ),
          );
        }
        setState(() => _isRegistering = false);
        return;
      }

      // Local check success
      _accessibilityManager.triggerSuccessVibration();
      _accessibilityManager.speak('Đã phát hiện khuôn mặt. Đang tải ảnh lên máy chủ.');

      if (mounted) {
        setState(() => _registrationStep = 'Đang gửi lên máy chủ...');
      }

      // Convert to base64
      final bytes = await File(image.path).readAsBytes();
      final base64Image = base64Encode(bytes);

      // Call API
      final response = await FaceService.registerFace(name, base64Image);

      if (mounted) {
        setState(() => _registrationStep = 'Đang chờ AI phản hồi...');
        _accessibilityManager.speak(
          'Tải ảnh lên thành công. Vui lòng chờ máy chủ xác nhận đăng ký.',
        );

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${response['message'] ?? 'Đã gửi yêu cầu thành công.'}',
            ),
            backgroundColor: AppTheme.accentCyan,
            duration: const Duration(seconds: 4),
          ),
        );
      }

      _nameController.clear();

      if (widget.wsService == null) {
        _accessibilityManager.speak(
          'Đã hoàn tất gửi yêu cầu đăng ký cho $name.',
        );
        setState(() => _isRegistering = false);
        _loadRegisteredFaces();
      }
    } catch (e) {
      debugPrint('DEBUG FACE REG ERROR: $e');
      _accessibilityManager.speak('Lỗi hệ thống trong quá trình đăng ký: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('LỖI: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 10),
            action: SnackBarAction(
              label: 'ĐÓNG',
              textColor: Colors.white,
              onPressed: () {},
            ),
          ),
        );
      }
    } finally {
      _accessibilityManager.triggerErrorVibration();
      if (mounted) setState(() => _isRegistering = false);
    }
  }

  Future<void> _deleteFace(String id, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: Text(
          'Xóa khuôn mặt',
          style: AppTheme.titleLarge.copyWith(fontSize: 18),
        ),
        content: Text(
          'Bạn có chắc muốn xóa khuôn mặt của "$name"?',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xóa', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await FaceService.deleteFace(id);
      _accessibilityManager.speak('Đã xóa khuôn mặt của $name.');
      _loadRegisteredFaces();
    } catch (e) {
      _accessibilityManager.speak('Lỗi khi xóa: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        backgroundColor: AppTheme.bgCard,
        elevation: 0,
        title: Text('Đăng ký người quen', style: AppTheme.titleLarge),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isFrontCamera ? Icons.camera_rear : Icons.camera_front,
              color: Colors.white,
            ),
            tooltip: 'Đổi camera',
            onPressed: _toggleCamera,
          ),
        ],
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Column(
              children: [
                // Camera section
                _buildCameraSection(),

                // Register button
                _buildRegisterButton(),

                const SizedBox(height: 8),
                const Divider(color: Colors.white12, indent: 16, endIndent: 16),

                // Registered faces list
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.people_rounded,
                        color: AppTheme.accentCyan,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Đã đăng ký (${_registeredFaces.length})',
                          style: AppTheme.titleLarge.copyWith(fontSize: 16),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                // Since we are inside SingleChildScrollView, we can't use Expanded directly for a list.
                // We'll use a fixed height or better, use a ListView with shrinkWrap.
                _buildFacesList(shrinkWrap: true),
              ],
            ),
          ),
          if (_isRegistering)
            Positioned.fill(
              child: Container(
                color: Colors.black.withValues(alpha: 0.6),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.all(32),
                    decoration: AppTheme.glassDecoration(
                      borderRadius: 24,
                      opacity: 0.7,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const CircularProgressIndicator(
                          color: AppTheme.accentCyan,
                          strokeWidth: 3,
                        ),
                        const SizedBox(height: 20),
                        Text(
                          _registrationStep.isNotEmpty
                              ? _registrationStep
                              : 'Đang xử lý...',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCameraSection() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.accentCyan.withValues(alpha: 0.3)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          // Name input
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            color: AppTheme.bgCard,
            child: TextField(
              controller: _nameController,
              style: const TextStyle(color: Colors.white, fontSize: 16),
              decoration: InputDecoration(
                labelText: 'Tên người thân',
                labelStyle: TextStyle(
                  color: Colors.white.withValues(alpha: 0.6),
                ),
                prefixIcon: const Icon(
                  Icons.person_rounded,
                  color: AppTheme.accentCyan,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.2),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.2),
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.accentCyan),
                ),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.05),
              ),
            ),
          ),

          // Camera preview
          SizedBox(
            height: 220,
            child: _isCameraReady
                ? Stack(
                    alignment: Alignment.center,
                    children: [
                      CameraPreview(_controller),
                      // Face guide overlay
                      Container(
                        width: 160,
                        height: 200,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: AppTheme.accentCyan.withValues(alpha: 0.5),
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(80),
                        ),
                      ),
                      Positioned(
                        bottom: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'Nhìn vào khung hình',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                    ],
                  )
                : const Center(
                    child: CircularProgressIndicator(
                      color: AppTheme.accentCyan,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: _isRegistering ? null : _register,
          icon: _isRegistering
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Icon(Icons.camera_alt_rounded),
          label: Text(
            _isRegistering ? 'Đang xử lý...' : 'Chụp và Đăng ký',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.accentCyan,
            foregroundColor: Colors.white,
            disabledBackgroundColor: AppTheme.accentCyan.withValues(alpha: 0.4),
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFacesList({bool shrinkWrap = false}) {
    if (_isLoadingFaces) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: CircularProgressIndicator(color: AppTheme.accentCyan),
        ),
      );
    }

    if (_registeredFaces.isEmpty) {
      return ListView(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 20),
          Icon(
            Icons.face_retouching_off_rounded,
            size: 48,
            color: Colors.white.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 12),
          Text(
            'Chưa có khuôn mặt nào được đăng ký',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.5),
              fontSize: 14,
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      shrinkWrap: shrinkWrap,
      physics: shrinkWrap
          ? const NeverScrollableScrollPhysics()
          : const BouncingScrollPhysics(),
      itemCount: _registeredFaces.length,
      itemBuilder: (context, index) {
        final face = _registeredFaces[index];
        final name = face['name']?.toString() ?? 'Unknown';
        final id = face['id']?.toString() ?? '';
        final createdAt = face['created_at']?.toString() ?? '';

        String formattedDate = '';
        if (createdAt.isNotEmpty) {
          try {
            final date = DateTime.parse(createdAt);
            formattedDate = '${date.day}/${date.month}/${date.year}';
          } catch (_) {}
        }

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 4,
            ),
            leading: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.accentCyan.withValues(alpha: 0.3),
                    AppTheme.accentCyan.withValues(alpha: 0.1),
                  ],
                ),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.face_rounded,
                color: AppTheme.accentCyan,
                size: 24,
              ),
            ),
            title: Text(
              name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            subtitle: formattedDate.isNotEmpty
                ? Text(
                    'Đăng ký: $formattedDate',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 12,
                    ),
                  )
                : null,
            trailing: IconButton(
              icon: const Icon(
                Icons.delete_outline_rounded,
                color: Colors.redAccent,
              ),
              onPressed: () => _deleteFace(id, name),
            ),
          ),
        );
      },
    );
  }
}
