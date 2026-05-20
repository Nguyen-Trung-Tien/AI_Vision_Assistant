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

  /// Danh sách 24 nhãn chuẩn của hệ thống (15 objects + 9 money).
  static const List<String> _unifiedLabels = [
    'vat_can',
    'cot_dien',
    'den_do',
    'den_vang',
    'den_xanh',
    'nap_cong',
    'nguoi',
    'o_ga',
    'rao_chan',
    'thung_rac',
    'vach_qua_duong',
    'xe_dap',
    'xe_lon',
    'xe_may',
    'cau_thang',
    '1000',
    '10000',
    '100000',
    '2000',
    '20000',
    '200000',
    '5000',
    '50000',
    '500000',
  ];

  /// Danh sách 9 nhãn khi dùng model chỉ có tiền (Money only).
  static const List<String> _moneyOnlyLabels = [
    '1000',
    '10000',
    '100000',
    '2000',
    '20000',
    '200000',
    '5000',
    '50000',
    '500000',
  ];

  /// Map nhãn model -> text hiển thị.
  static const Map<String, String> _labelMap = {
    '1000': '1.000 đồng',
    '10000': '10.000 đồng',
    '100000': '100.000 đồng',
    '2000': '2.000 đồng',
    '20000': '20.000 đồng',
    '200000': '200.000 đồng',
    '5000': '5.000 đồng',
    '50000': '50.000 đồng',
    '500000': '500.000 đồng',
    'vat_can': 'vật cản',
    'cot_dien': 'cột điện',
    'den_do': 'đèn đỏ',
    'den_vang': 'đèn vàng',
    'den_xanh': 'đèn xanh',
    'nap_cong': 'nắp cống',
    'nguoi': 'người',
    'o_ga': 'ổ gà',
    'rao_chan': 'rào chắn',
    'thung_rac': 'thùng rác',
    'vach_qua_duong': 'vạch qua đường',
    'xe_dap': 'xe đạp',
    'xe_lon': 'xe lớn',
    'xe_may': 'xe máy',
    'cau_thang': 'cầu thang',
  };

  /// Load model từ assets hoặc local storage.
  Future<bool> loadModel() async {
    if (_isModelLoaded) return true;

    try {
      Object? lastError;

      // 1. Check local models first (for OTA updates)
      final localModels = await _candidateLocalModels();
      for (final file in localModels) {
        try {
          _interpreter = await _createInterpreterFromFile(file);
          _loadedModelAsset = file.path;
          debugPrint(
            '[TFLite] Successfully loaded LOCAL model from ${file.path}',
          );
          break;
        } catch (e) {
          lastError = e;
          debugPrint('[TFLite] Failed loading local model ${file.path}: $e');
        }
      }

      // 2. Fallback to asset models if no local model found
      if (_interpreter == null) {
        final candidateAssets = await _candidateAssetModels();
        for (final assetPath in candidateAssets) {
          try {
            _interpreter = await _createInterpreterFromAsset(assetPath);
            _loadedModelAsset = assetPath;
            debugPrint(
              '[TFLite] Successfully loaded ASSET model from $assetPath',
            );
            break;
          } catch (e) {
            lastError = e;
            debugPrint('[TFLite] Failed loading asset model $assetPath: $e');
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
      if (outputShape.length == 2 &&
          outputShape.last != _unifiedLabels.length &&
          outputShape.last != _moneyOnlyLabels.length) {
        debugPrint(
          '[TFLite] WARNING: Model output size (${outputShape.last}) '
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
      'assets/models/money/best_float32.tflite',
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
      if (ext != null) {
        dirs.add(ext);
        // Try to add the public Download folder
        final androidIndex = ext.path.indexOf('Android');
        if (androidIndex != -1) {
          final downloadPath = '${ext.path.substring(0, androidIndex)}Download';
          final downloadDir = Directory(downloadPath);
          if (await downloadDir.exists()) {
            dirs.add(downloadDir);
          }
          final docPath = '${ext.path.substring(0, androidIndex)}Documents';
          final docDir = Directory(docPath);
          if (await docDir.exists()) {
            dirs.add(docDir);
          }
        }
      }
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

      List<String> currentLabels = _moneyOnlyLabels;
      if (outputShape.length == 3) {
        final first = outputShape[1];
        final second = outputShape[2];
        final channels = first < second ? first : second;
        final numClasses = channels - 4;
        if (numClasses == 24) {
          currentLabels = _unifiedLabels;
        } else if (numClasses == 9) {
          currentLabels = _moneyOnlyLabels;
        } else if (numClasses == 15) {
          currentLabels = _unifiedLabels.sublist(0, 15);
        } else if (numClasses > 0 && numClasses <= _unifiedLabels.length) {
          currentLabels = _unifiedLabels.sublist(0, numClasses);
        } else {
          currentLabels = _unifiedLabels;
        }
      }

      List<double>? probabilities;
      if (outputShape.length == 2) {
        final scores = (output[0] as List).map((e) => (e as num).toDouble());
        probabilities = _fitScoresToLabels(scores.toList(), currentLabels);
      } else {
        probabilities = _parseYoloLikeOutput(
          output,
          outputShape,
          currentLabels,
        );
      }

      if (probabilities == null ||
          probabilities.length != currentLabels.length) {
        return 'Lỗi: Model không tương thích với chế độ nhận diện offline.';
      }

      double maxProb = -1.0;
      int maxIndex = -1;
      for (int i = 0; i < probabilities.length; i++) {
        final label = currentLabels[i];
        if (_moneyOnlyLabels.contains(label)) {
          if (probabilities[i] > maxProb) {
            maxProb = probabilities[i];
            maxIndex = i;
          }
        }
      }

      debugPrint(
        '[TFLite] Inference done. Max prob: $maxProb at index $maxIndex (Label: ${maxIndex != -1 ? currentLabels[maxIndex] : "None"})',
      );

      if (maxIndex != -1 && maxProb > 0.35) {
        final label = currentLabels[maxIndex];
        return labelToDenomination(label);
      }
      return 'Không nhận diện rõ đối tượng.';
    } catch (e) {
      debugPrint('[TFLite] Inference error: $e');
      return 'Lỗi nhận diện offline: $e';
    }
  }

  List<double>? _fitScoresToLabels(
    List<double> rawScores,
    List<String> currentLabels,
  ) {
    if (rawScores.length == currentLabels.length) {
      return rawScores;
    }

    if (rawScores.length > currentLabels.length) {
      return rawScores.sublist(0, currentLabels.length);
    }
    return null;
  }

  List<double>? _parseYoloLikeOutput(
    dynamic output,
    List<int> shape,
    List<String> currentLabels,
  ) {
    if (shape.length != 3 || shape[0] != 1) return null;

    const classStart = 4;
    final expected = classStart + currentLabels.length;
    final first = shape[1];
    final second = shape[2];

    // Format A: [1, channels, anchors], ví dụ [1, 28, 8400].
    if (first < second && first >= expected) {
      final channels = first;
      final anchors = second;
      final probs = List<double>.filled(currentLabels.length, 0);
      for (int anchor = 0; anchor < anchors; anchor++) {
        for (int c = 0; c < currentLabels.length; c++) {
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
    if (second < first && second >= expected) {
      final anchors = first;
      final channels = second;
      final probs = List<double>.filled(currentLabels.length, 0);
      for (int anchor = 0; anchor < anchors; anchor++) {
        final row = ((output[0] as List)[anchor] as List);
        for (int c = 0; c < currentLabels.length; c++) {
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

  /// Map label sang tên hiển thị (mệnh giá hoặc vật thể).
  static String labelToDenomination(String label) {
    return _labelMap[label] ?? label;
  }

  void dispose() {
    _interpreter?.close();
    _interpreter = null;
    _isModelLoaded = false;
    _loadedModelAsset = null;
  }
}
