import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:google_mlkit_barcode_scanning/google_mlkit_barcode_scanning.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:http/http.dart' as http;
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/history_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MlKitService {
  final TextRecognizer _textRecognizer = TextRecognizer(
    script: TextRecognitionScript.latin,
  );
  final BarcodeScanner _barcodeScanner = BarcodeScanner();
  final FaceDetector _faceDetector = FaceDetector(
    options: FaceDetectorOptions(
      enableContours: false,
      enableClassification: false,
    ),
  );
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final HistoryService _historyService = HistoryService();
  SharedPreferences? _prefs;
  static const String _barcodeCachePrefix = 'barcode_name_';

  bool _isProcessing = false;

  void dispose() {
    _textRecognizer.close();
    _barcodeScanner.close();
    _faceDetector.close();
  }

  Future<String?> processImageFile(String imagePath) async {
    if (_isProcessing) return null;
    _isProcessing = true;

    try {
      final inputImage = InputImage.fromFilePath(imagePath);

      // Attempt barcode first.
      final barcodes = await _barcodeScanner.processImage(inputImage);
      if (barcodes.isNotEmpty) {
        final barcodeValue = barcodes.first.displayValue;
        if (barcodeValue != null && barcodeValue.isNotEmpty) {
          _accessibilityManager.triggerSuccessVibration();

          final productName = await _lookupProduct(barcodeValue);
          if (productName != null) {
            final text = 'Sản phẩm: $productName';
            _accessibilityManager.speak(text);
            _historyService.addEntry(
              'barcode',
              '$text ($barcodeValue)',
            );
            return text;
          } else {
            final text = 'Không tra cứu được tên sản phẩm. Mã vạch: $barcodeValue';
            _accessibilityManager.speak(text);
            _historyService.addEntry(
              'barcode',
              'Không tra cứu được tên sản phẩm ($barcodeValue)',
            );
            return text;
          }
        }
      }

      // Fallback to text recognition.
      final recognizedText = await _textRecognizer.processImage(inputImage);
      if (recognizedText.text.trim().isNotEmpty) {
        _accessibilityManager.triggerSuccessVibration();
        _accessibilityManager.speak(recognizedText.text);
        _historyService.addEntry('text', recognizedText.text);
        return recognizedText.text;
      } else {
        _accessibilityManager.speak('Không tìm thấy văn bản.');
        return null;
      }
    } catch (e) {
      debugPrint('Error processing ML Kit image: $e');
      _accessibilityManager.triggerErrorVibration();
      return null;
    } finally {
      Future.delayed(const Duration(seconds: 2), () {
        _isProcessing = false;
      });
    }
  }

  Future<List<Face>> detectFaces(String imagePath) async {
    try {
      final inputImage = InputImage.fromFilePath(imagePath);
      return await _faceDetector.processImage(inputImage);
    } catch (e) {
      debugPrint('Error detecting faces: $e');
      return [];
    }
  }

  Future<String?> _lookupProduct(String barcode) async {
    final cleanBarcode = barcode.trim();
    if (cleanBarcode.isEmpty) return null;

    final cached = await _getCachedProductName(cleanBarcode);
    if (cached != null) {
      debugPrint('[MLKit] Product cache hit for $cleanBarcode');
      return cached;
    }

    try {
      // Try multiple Open*Facts datasets to improve hit rate.
      final candidates = <String>[
        'https://world.openfoodfacts.org/api/v2/product/$cleanBarcode.json',
        'https://world.openbeautyfacts.org/api/v2/product/$cleanBarcode.json',
        'https://world.openpetfoodfacts.org/api/v2/product/$cleanBarcode.json',
      ];

      for (final endpoint in candidates) {
        final result = await _lookupFromEndpoint(endpoint);
        if (result != null) {
          await _cacheProductName(cleanBarcode, result);
          return result;
        }
      }

      final fallback = await _lookupFromUpcItemDb(cleanBarcode);
      if (fallback != null) {
        await _cacheProductName(cleanBarcode, fallback);
        return fallback;
      }
    } catch (e) {
      debugPrint('[MLKit] Error looking up barcode $cleanBarcode: $e');
    }

    return null;
  }

  Future<String?> _lookupFromEndpoint(String endpoint) async {
    final uri = Uri.parse(endpoint);
    final response = await http.get(
      uri,
      headers: const {
        'User-Agent': 'AIVisionAssistant/1.0 (mobile)',
        'Accept': 'application/json',
      },
    ).timeout(const Duration(seconds: 5));

    if (response.statusCode != 200) return null;

    final data = jsonDecode(response.body);
    if (data is! Map<String, dynamic>) return null;

    final status = data['status'];
    final product = data['product'];
    if (status != 1 || product is! Map<String, dynamic>) return null;

    return _extractBestProductName(product);
  }

  Future<String?> _lookupFromUpcItemDb(String barcode) async {
    final uri = Uri.parse(
      'https://api.upcitemdb.com/prod/trial/lookup?upc=$barcode',
    );
    final response = await http.get(
      uri,
      headers: const {
        'User-Agent': 'AIVisionAssistant/1.0 (mobile)',
        'Accept': 'application/json',
      },
    ).timeout(const Duration(seconds: 5));

    if (response.statusCode != 200) return null;

    final data = jsonDecode(response.body);
    if (data is! Map<String, dynamic>) return null;
    final items = data['items'];
    if (items is! List || items.isEmpty) return null;

    final first = items.first;
    if (first is! Map<String, dynamic>) return null;

    final title = first['title']?.toString().trim();
    if (title != null && title.isNotEmpty) return title;

    return null;
  }

  Future<SharedPreferences> _getPrefs() async {
    final existing = _prefs;
    if (existing != null) return existing;
    final created = await SharedPreferences.getInstance();
    _prefs = created;
    return created;
  }

  Future<String?> _getCachedProductName(String barcode) async {
    final prefs = await _getPrefs();
    final value = prefs.getString('$_barcodeCachePrefix$barcode');
    if (value == null) return null;
    final trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  Future<void> _cacheProductName(String barcode, String productName) async {
    final value = productName.trim();
    if (value.isEmpty) return;
    final prefs = await _getPrefs();
    await prefs.setString('$_barcodeCachePrefix$barcode', value);
  }

  String? _extractBestProductName(Map<String, dynamic> productMap) {
    final candidates = <dynamic>[
      productMap['product_name_vi'],
      productMap['product_name_vn'],
      productMap['product_name_en'],
      productMap['product_name'],
      productMap['generic_name_vi'],
      productMap['generic_name_en'],
      productMap['generic_name'],
    ];

    for (final value in candidates) {
      if (value == null) continue;
      final text = value.toString().trim();
      if (text.isNotEmpty) return text;
    }
    return null;
  }
}
