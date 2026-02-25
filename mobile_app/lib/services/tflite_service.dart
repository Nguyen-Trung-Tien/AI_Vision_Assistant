import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Service nhận diện tiền offline bằng TFLite.
/// Cần file model .tflite trong assets.
class TfliteService {
  static final TfliteService _instance = TfliteService._internal();
  factory TfliteService() => _instance;
  TfliteService._internal();

  bool _isModelLoaded = false;
  bool get isModelLoaded => _isModelLoaded;

  // Model sẽ là list of bytes
  Uint8List? _modelBytes;

  /// Danh sách nhãn mệnh giá output của model (sẽ dùng khi tích hợp interpreter)
  // ignore: unused_field
  static const List<String> _labels = [
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

  /// Map nhãn model → text hiển thị
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

  /// Load model từ assets
  Future<bool> loadModel() async {
    if (_isModelLoaded) return true;

    try {
      _modelBytes = (await rootBundle.load(
        'assets/models/money_detector.tflite',
      )).buffer.asUint8List();
      _isModelLoaded = true;
      debugPrint(
        '[TFLite] Model loaded successfully (${_modelBytes!.length} bytes)',
      );
      return true;
    } catch (e) {
      debugPrint('[TFLite] Model not found in assets: $e');
      _isModelLoaded = false;
      return false;
    }
  }

  /// Chạy inference trên thiết bị
  /// Returns text kết quả hoặc null nếu model chưa load
  Future<String?> detectMoney(Uint8List imageBytes) async {
    if (!_isModelLoaded || _modelBytes == null) {
      return null;
    }

    try {
      // TODO: Tích hợp tflite_flutter interpreter khi có model thật
      // Hiện tại trả về placeholder để giữ flow
      // Khi có model .tflite thật:
      // 1. final interpreter = Interpreter.fromBuffer(_modelBytes!);
      // 2. Resize & normalize imageBytes → input tensor
      // 3. interpreter.run(input, output)
      // 4. Parse output → label + confidence
      debugPrint('[TFLite] Inference requested (${imageBytes.length} bytes)');

      return 'Chế độ offline: Cần file model .tflite trong assets/models/ để nhận diện.';
    } catch (e) {
      debugPrint('[TFLite] Inference error: $e');
      return 'Lỗi nhận diện offline: $e';
    }
  }

  /// Map label sang tên mệnh giá
  static String labelToDenomination(String label) {
    return _denominationMap[label] ?? label;
  }

  void dispose() {
    _modelBytes = null;
    _isModelLoaded = false;
  }
}
