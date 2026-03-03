import 'package:flutter/foundation.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;

/// Service nhận diện offline bằng TFLite.
/// Hỗ trợ 2 model:
///   1. money_detector.tflite  — nhận diện mệnh giá tiền Việt Nam
///   2. scene_descriptor.tflite — mô tả/nhận diện không gian (đã train bằng Python)
class TfliteService {
  static final TfliteService _instance = TfliteService._internal();
  factory TfliteService() => _instance;
  TfliteService._internal();

  // ─── Money model ───────────────────────────────────────────────
  Interpreter? _moneyInterpreter;
  bool _isMoneyModelLoaded = false;
  bool get isModelLoaded => _isMoneyModelLoaded;

  static const List<String> _moneyLabels = [
    'tien_1k',
    'tien_2k',
    'tien_5k',
    'tien_10k',
    'tien_20k',
    'tien_50k',
    'tien_100k',
    'tien_200k',
    'tien_500k',
  ];

  static const Map<String, String> _denominationMap = {
    'tien_1k': '1.000 đồng',
    'tien_2k': '2.000 đồng',
    'tien_5k': '5.000 đồng',
    'tien_10k': '10.000 đồng',
    'tien_20k': '20.000 đồng',
    'tien_50k': '50.000 đồng',
    'tien_100k': '100.000 đồng',
    'tien_200k': '200.000 đồng',
    'tien_500k': '500.000 đồng',
  };

  // ─── Scene model ──────────────────────────────────────────────
  Interpreter? _sceneInterpreter;
  bool _isSceneModelLoaded = false;
  bool get isSceneModelLoaded => _isSceneModelLoaded;

  /// Danh sách nhãn của scene model (edit lại cho đúng với model bạn train).
  /// Thứ tự PHẢI khớp với output layer của file scene_descriptor.tflite.
  static const List<String> sceneLabels = [
    'phòng ngủ',
    'phòng khách',
    'bếp',
    'nhà vệ sinh',
    'văn phòng',
    'đường phố',
    'công viên',
    'siêu thị',
    'trường học',
    'bệnh viện',
    'nhà hàng',
    'ngoài trời',
  ];

  // ─── Load models ──────────────────────────────────────────────

  /// Load cả 2 model. Gọi 1 lần khi khởi động app.
  Future<void> loadModel() async {
    await Future.wait([_loadMoneyModel(), _loadSceneModel()]);
  }

  Future<bool> _loadMoneyModel() async {
    if (_isMoneyModelLoaded) return true;
    try {
      _moneyInterpreter = await Interpreter.fromAsset(
        'assets/models/money_detector.tflite',
      );
      _isMoneyModelLoaded = true;
      debugPrint('[TFLite] Money model loaded');
      return true;
    } catch (e) {
      debugPrint('[TFLite] Money model load failed: $e');
      _isMoneyModelLoaded = false;
      return false;
    }
  }

  Future<bool> _loadSceneModel() async {
    if (_isSceneModelLoaded) return true;
    try {
      _sceneInterpreter = await Interpreter.fromAsset(
        'assets/models/scene_descriptor.tflite',
      );
      _isSceneModelLoaded = true;
      debugPrint('[TFLite] Scene model loaded');
      return true;
    } catch (e) {
      debugPrint('[TFLite] Scene model not found or load failed: $e');
      _isSceneModelLoaded = false;
      return false;
    }
  }

  // ─── Inference helpers ─────────────────────────────────────────

  /// Tiền xử lý ảnh: resize về [size]x[size], normalize về [-1, 1].
  List _prepareInput(Uint8List imageBytes, int size) {
    final image = img.decodeImage(imageBytes);
    if (image == null) throw Exception('Không đọc được ảnh từ camera.');
    final resized = img.copyResize(image, width: size, height: size);

    return List.generate(
      1,
      (_) => List.generate(
        size,
        (y) => List.generate(size, (x) {
          final pixel = resized.getPixel(x, y);
          return [
            (pixel.r / 127.5) - 1.0,
            (pixel.g / 127.5) - 1.0,
            (pixel.b / 127.5) - 1.0,
          ];
        }),
      ),
    );
  }

  int _argmax(List<double> probs) {
    int maxIdx = 0;
    for (int i = 1; i < probs.length; i++) {
      if (probs[i] > probs[maxIdx]) maxIdx = i;
    }
    return maxIdx;
  }

  // ─── Money Detection ──────────────────────────────────────────

  /// Nhận diện mệnh giá tiền từ frame camera.
  /// Returns chuỗi mô tả hoặc null nếu model chưa load.
  Future<String?> detectMoney(Uint8List imageBytes) async {
    if (!_isMoneyModelLoaded || _moneyInterpreter == null) {
      return 'Chưa tải được model nhận diện tiền offline.';
    }

    try {
      final input = _prepareInput(imageBytes, 224);
      final numClasses = _moneyLabels.length;
      final output = List.filled(numClasses, 0.0).reshape([1, numClasses]);

      debugPrint('[TFLite] Running money inference...');
      _moneyInterpreter!.run(input, output);

      final probs = output[0] as List<double>;
      final maxIdx = _argmax(probs);
      final maxProb = probs[maxIdx];

      debugPrint('[TFLite] Money result: ${_moneyLabels[maxIdx]} ($maxProb)');

      if (maxProb > 0.6) {
        return labelToDenomination(_moneyLabels[maxIdx]);
      } else {
        return 'Không nhận diện rõ mệnh giá';
      }
    } catch (e) {
      debugPrint('[TFLite] Money inference error: $e');
      return 'Lỗi nhận diện tiền offline: $e';
    }
  }

  static String labelToDenomination(String label) {
    return _denominationMap[label] ?? label;
  }

  // ─── Scene Description ─────────────────────────────────────────

  /// Nhận diện/mô tả cảnh vật từ frame camera (offline).
  /// Returns chuỗi mô tả hoặc null nếu model chưa load.
  Future<String?> describeScene(Uint8List imageBytes) async {
    if (!_isSceneModelLoaded || _sceneInterpreter == null) {
      return null; // caller sẽ thông báo model chưa có
    }

    try {
      final input = _prepareInput(imageBytes, 224);
      final numClasses = sceneLabels.length;
      final output = List.filled(numClasses, 0.0).reshape([1, numClasses]);

      debugPrint('[TFLite] Running scene inference...');
      _sceneInterpreter!.run(input, output);

      final probs = output[0] as List<double>;
      final maxIdx = _argmax(probs);
      final maxProb = probs[maxIdx];

      debugPrint('[TFLite] Scene result: ${sceneLabels[maxIdx]} ($maxProb)');

      if (maxProb > 0.5) {
        return 'Đây có vẻ là ${sceneLabels[maxIdx]}';
      } else {
        // Trả về top-2 kết quả để có thêm thông tin
        final sorted = List<int>.generate(probs.length, (i) => i)
          ..sort((a, b) => probs[b].compareTo(probs[a]));
        final top1 = sceneLabels[sorted[0]];
        final top2 = sceneLabels[sorted[1]];
        return 'Có thể là $top1 hoặc $top2';
      }
    } catch (e) {
      debugPrint('[TFLite] Scene inference error: $e');
      return 'Lỗi nhận diện cảnh vật offline: $e';
    }
  }

  // ─── Dispose ──────────────────────────────────────────────────

  void dispose() {
    _moneyInterpreter?.close();
    _moneyInterpreter = null;
    _isMoneyModelLoaded = false;

    _sceneInterpreter?.close();
    _sceneInterpreter = null;
    _isSceneModelLoaded = false;
  }
}
