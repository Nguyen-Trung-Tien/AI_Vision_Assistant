import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';
import 'package:tflite_flutter/tflite_flutter.dart';

/// Service nhận diện tiền offline bằng TFLite.
/// Hỗ trợ load model từ assets và file local trong bộ nhớ ứng dụng.
class TfliteService {
  static final TfliteService _instance = TfliteService._internal();
  factory TfliteService() => _instance;
  TfliteService._internal();

  bool _isModelLoaded = false;
  bool get isModelLoaded => _isModelLoaded;

  Interpreter? _interpreter;
  String? _loadedModelAsset;
  String? get loadedModelSource => _loadedModelAsset;

  /// Danh sách nhãn mệnh giá output của model.
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

  /// Map nhãn model -> text hiển thị.
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

  /// Load model từ assets hoặc local storage.
  Future<bool> loadModel() async {
    if (_isModelLoaded) return true;

    try {
      Object? lastError;
      final candidateAssets = await _candidateAssetModels();
      for (final assetPath in candidateAssets) {
        try {
          _interpreter = await _createInterpreterFromAsset(assetPath);
          _loadedModelAsset = assetPath;
          break;
        } catch (e) {
          lastError = e;
          debugPrint('[TFLite] Failed loading asset model $assetPath: $e');
        }
      }

      if (_interpreter == null) {
        final localModels = await _candidateLocalModels();
        for (final file in localModels) {
          try {
            _interpreter = await _createInterpreterFromFile(file);
            _loadedModelAsset = file.path;
            break;
          } catch (e) {
            lastError = e;
            debugPrint('[TFLite] Failed loading local model ${file.path}: $e');
          }
        }
      }

      if (_interpreter == null) {
        throw Exception(lastError ?? 'No compatible TFLite model found.');
      }

      _isModelLoaded = true;
      final outputShape = _interpreter!.getOutputTensor(0).shape;
      debugPrint(
        '[TFLite] Model loaded from $_loadedModelAsset. Output shape: $outputShape',
      );
      if (outputShape.last != _labels.length) {
        debugPrint(
          '[TFLite] WARNING: Model output size (${outputShape.last}) '
          'does not match label count (${_labels.length}). '
          'Results may be incorrect if this is not a classification model.',
        );
      }
      return true;
    } catch (e) {
      debugPrint('[TFLite] Model not found in assets or load failed: $e');
      _isModelLoaded = false;
      _loadedModelAsset = null;
      return false;
    }
  }

  Future<Interpreter> _createInterpreterFromAsset(String assetPath) async {
    final options = InterpreterOptions()..threads = 2;
    return Interpreter.fromAsset(assetPath, options: options);
  }

  Future<Interpreter> _createInterpreterFromFile(File modelFile) async {
    final options = InterpreterOptions()..threads = 2;
    return Interpreter.fromFile(modelFile, options: options);
  }

  Future<List<String>> _candidateAssetModels() async {
    const priorityCandidates = <String>[
      'assets/models/best_float32.tflite',
      'assets/models/best_float16.tflite',
      'assets/models/money_detector.tflite',
    ];

    final deduped = <String>{...priorityCandidates};
    try {
      final manifestJson = await rootBundle.loadString('AssetManifest.json');
      final manifestMap = jsonDecode(manifestJson) as Map<String, dynamic>;
      for (final key in manifestMap.keys) {
        if (key.toLowerCase().endsWith('.tflite')) {
          deduped.add(key);
        }
      }
    } catch (e) {
      debugPrint('[TFLite] Could not read AssetManifest.json: $e');
    }

    return deduped.toList();
  }

  Future<List<File>> _candidateLocalModels() async {
    if (kIsWeb) return const <File>[];

    const modelNames = <String>[
      'best_float32.tflite',
      'best_float16.tflite',
      'money_detector.tflite',
      'model.tflite',
    ];

    final dirs = <Directory>[];
    try {
      dirs.add(await getApplicationSupportDirectory());
    } catch (_) {}
    try {
      dirs.add(await getApplicationDocumentsDirectory());
    } catch (_) {}
    try {
      dirs.add(await getTemporaryDirectory());
    } catch (_) {}
    try {
      final ext = await getExternalStorageDirectory();
      if (ext != null) dirs.add(ext);
    } catch (_) {}

    final discovered = <String>{};
    for (final dir in dirs) {
      for (final name in modelNames) {
        final direct = File('${dir.path}${Platform.pathSeparator}$name');
        if (await direct.exists()) {
          discovered.add(direct.path);
        }

        final inModels = File(
          '${dir.path}${Platform.pathSeparator}models${Platform.pathSeparator}$name',
        );
        if (await inModels.exists()) {
          discovered.add(inModels.path);
        }
      }

      final modelDir = Directory('${dir.path}${Platform.pathSeparator}models');
      if (!await modelDir.exists()) continue;

      try {
        await for (final entity in modelDir.list(
          recursive: true,
          followLinks: false,
        )) {
          if (entity is! File) continue;
          if (!entity.path.toLowerCase().endsWith('.tflite')) continue;
          discovered.add(entity.path);
        }
      } catch (e) {
        debugPrint('[TFLite] Local scan error at ${modelDir.path}: $e');
      }
    }

    return discovered.map(File.new).toList();
  }

  /// Chạy inference trên thiết bị.
  /// Returns text kết quả hoặc null nếu model chưa load.
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

      final inputTensor = _interpreter!.getInputTensor(0);
      final inputShape = inputTensor.shape;
      final inputType = inputTensor.type;
      final inputHeight = inputShape.length >= 3 ? inputShape[1] : 224;
      final inputWidth = inputShape.length >= 3 ? inputShape[2] : 224;

      debugPrint('[TFLite] Resizing image to $inputWidth x $inputHeight...');
      final resizedImage = img.copyResize(
        image,
        width: inputWidth,
        height: inputHeight,
      );

      final isFloatInput = _isFloatTensorType(inputType);
      final input = List.generate(
        1,
        (_) => List.generate(
          inputHeight,
          (y) => List.generate(inputWidth, (x) {
            final pixel = resizedImage.getPixel(x, y);
            if (isFloatInput) {
              return [pixel.r / 255.0, pixel.g / 255.0, pixel.b / 255.0];
            }
            return [pixel.r, pixel.g, pixel.b];
          }),
        ),
      );

      final outputTensor = _interpreter!.getOutputTensor(0);
      final outputShape = outputTensor.shape;
      final outputType = outputTensor.type;
      dynamic output;

      if (outputShape.length == 2) {
        output = List.generate(
          outputShape[0],
          (_) => List.filled(
            outputShape[1],
            _isUint8TensorType(outputType) ? 0 : 0.0,
          ),
        );
      } else if (outputShape.length == 3) {
        output = List.generate(
          outputShape[0],
          (_) => List.generate(
            outputShape[1],
            (_) => List.filled(
              outputShape[2],
              _isUint8TensorType(outputType) ? 0 : 0.0,
            ),
          ),
        );
      } else {
        return 'Lỗi: Output shape không được hỗ trợ ($outputShape).';
      }

      debugPrint('[TFLite] Running interpreter...');
      _interpreter!.run(input, output);

      List<double>? probabilities;
      if (outputShape.length == 2) {
        final scores = (output[0] as List).map((e) => (e as num).toDouble());
        probabilities = _fitScoresToLabels(scores.toList());
      } else {
        probabilities = _parseYoloLikeOutput(output, outputShape);
      }

      if (probabilities == null || probabilities.length != _labels.length) {
        return 'Lỗi: Model không tương thích với chế độ nhận diện tiền offline.';
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

      if (maxProb > 0.35) {
        final label = _labels[maxIndex];
        return labelToDenomination(label);
      }
      return 'Không nhận diện rõ mệnh giá.';
    } catch (e) {
      debugPrint('[TFLite] Inference error: $e');
      return 'Lỗi nhận diện offline: $e';
    }
  }

  List<double>? _fitScoresToLabels(List<double> rawScores) {
    if (rawScores.length == _labels.length) {
      return rawScores;
    }

    if (rawScores.length > _labels.length) {
      return rawScores.sublist(0, _labels.length);
    }
    return null;
  }

  List<double>? _parseYoloLikeOutput(dynamic output, List<int> shape) {
    if (shape.length != 3 || shape[0] != 1) return null;

    const classStart = 4;
    final expected = classStart + _labels.length;
    final first = shape[1];
    final second = shape[2];

    // Format A: [1, channels, anchors], ví dụ [1, 13, 8400].
    if (first >= expected) {
      final channels = first;
      final anchors = second;
      final probs = List<double>.filled(_labels.length, 0);
      for (int anchor = 0; anchor < anchors; anchor++) {
        for (int c = 0; c < _labels.length; c++) {
          if (classStart + c >= channels) continue;
          final score =
              (((output[0] as List)[classStart + c] as List)[anchor] as num)
                  .toDouble();
          if (score > probs[c]) probs[c] = score;
        }
      }
      return probs;
    }

    // Format B: [1, anchors, channels].
    if (second >= expected) {
      final anchors = first;
      final channels = second;
      final probs = List<double>.filled(_labels.length, 0);
      for (int anchor = 0; anchor < anchors; anchor++) {
        final row = ((output[0] as List)[anchor] as List);
        for (int c = 0; c < _labels.length; c++) {
          if (classStart + c >= channels) continue;
          final score = (row[classStart + c] as num).toDouble();
          if (score > probs[c]) probs[c] = score;
        }
      }
      return probs;
    }

    return null;
  }

  bool _isFloatTensorType(Object type) {
    final t = type.toString().toLowerCase();
    return t.contains('float32') || t.contains('float');
  }

  bool _isUint8TensorType(Object type) {
    final t = type.toString().toLowerCase();
    return t.contains('uint8') || t.contains('u_int8') || t.contains('byte');
  }

  /// Map label sang tên mệnh giá.
  static String labelToDenomination(String label) {
    return _denominationMap[label] ?? label;
  }

  void dispose() {
    _interpreter?.close();
    _interpreter = null;
    _isModelLoaded = false;
    _loadedModelAsset = null;
  }
}
