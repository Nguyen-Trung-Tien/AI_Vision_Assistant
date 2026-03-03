import 'package:flutter/foundation.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;

/// Service nhận diện tiền offline bằng TFLite.
/// Cần file model .tflite trong assets.
class TfliteService {
  static final TfliteService _instance = TfliteService._internal();
  factory TfliteService() => _instance;
  TfliteService._internal();

  bool _isModelLoaded = false;
  bool get isModelLoaded => _isModelLoaded;

  Interpreter? _interpreter;

  /// Danh sách nhãn mệnh giá output của model
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
      _interpreter = await Interpreter.fromAsset(
        'assets/models/money_detector.tflite',
      );
      _isModelLoaded = true;
      // Log output tensor shape để phát hiện sớm nếu model bị thay đổi
      final outputShape = _interpreter!.getOutputTensor(0).shape;
      debugPrint('[TFLite] Model loaded. Output shape: $outputShape');
      if (outputShape.last != _labels.length) {
        debugPrint(
          '[TFLite] WARNING: Model output size (${outputShape.last}) '
          'does not match label count (${_labels.length}). '
          'Results may be incorrect.',
        );
      }
      return true;
    } catch (e) {
      debugPrint('[TFLite] Model not found in assets or load failed: $e');
      _isModelLoaded = false;
      return false;
    }
  }

  /// Chạy inference trên thiết bị
  /// Returns text kết quả hoặc null nếu model chưa load
  Future<String?> detectMoney(Uint8List imageBytes) async {
    if (!_isModelLoaded || _interpreter == null) {
      return 'Chưa tải được model nhận diện offline.';
    }

    try {
      debugPrint('[TFLite] Decoding image...');
      final image = img.decodeImage(imageBytes);
      if (image == null) {
        return 'Lỗi đọc khung hình camera.';
      }

      // Resize về 224x224
      debugPrint('[TFLite] Resizing image for model input...');
      final resizedImage = img.copyResize(image, width: 224, height: 224);

      // Chuyển pixel thành tensor chuẩn Normalize [-1, 1]
      // tùy thuộc vào model được huấn luyện cụ thể
      var input = List.generate(
        1,
        (i) => List.generate(
          224,
          (y) => List.generate(224, (x) {
            final pixel = resizedImage.getPixel(x, y);
            return [
              (pixel.r / 127.5) - 1.0,
              (pixel.g / 127.5) - 1.0,
              (pixel.b / 127.5) - 1.0,
            ];
          }),
        ),
      );

      // Giả định model trả về xác suất 9 class
      var output = List.filled(1 * 9, 0.0).reshape([1, 9]);

      debugPrint('[TFLite] Running interpreter...');
      _interpreter!.run(input, output);

      final probabilities = output[0] as List<double>;

      // Guard: ensure output length matches label count to prevent RangeError
      if (probabilities.length != _labels.length) {
        debugPrint(
          '[TFLite] Output length mismatch: '
          'got ${probabilities.length}, expected ${_labels.length}',
        );
        return 'Lỗi: Model không tương thích (đầu ra ${probabilities.length} lớp).';
      }
      double maxProb = probabilities[0];
      int maxIndex = 0;

      for (int i = 1; i < probabilities.length; i++) {
        if (probabilities[i] > maxProb) {
          maxProb = probabilities[i];
          maxIndex = i;
        }
      }

      debugPrint(
        '[TFLite] Inference done. Max prob: $maxProb at index $maxIndex',
      );

      if (maxProb > 0.6) {
        // Ngưỡng nhận diện
        String label = _labels[maxIndex];
        return labelToDenomination(label);
      } else {
        return 'Không nhận diện rõ mệnh giá';
      }
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
    _interpreter?.close();
    _interpreter = null;
    _isModelLoaded = false;
  }
}
