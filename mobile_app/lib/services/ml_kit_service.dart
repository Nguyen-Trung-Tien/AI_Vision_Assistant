import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:google_mlkit_barcode_scanning/google_mlkit_barcode_scanning.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:flutter/foundation.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/history_service.dart';

class MlKitService {
  final TextRecognizer _textRecognizer = TextRecognizer(
    script: TextRecognitionScript.latin,
  );
  final BarcodeScanner _barcodeScanner = BarcodeScanner();
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final HistoryService _historyService = HistoryService();

  bool _isProcessing = false;

  void dispose() {
    _textRecognizer.close();
    _barcodeScanner.close();
  }

  Future<void> processImageFile(String imagePath) async {
    if (_isProcessing) return;
    _isProcessing = true;

    try {
      final inputImage = InputImage.fromFilePath(imagePath);

      // Attempt Barcode parsing first
      final barcodes = await _barcodeScanner.processImage(inputImage);
      if (barcodes.isNotEmpty) {
        final barcodeValue = barcodes.first.displayValue;
        if (barcodeValue != null && barcodeValue.isNotEmpty) {
          _accessibilityManager.triggerSuccessVibration();

          // Tra cứu tên sản phẩm từ mã vạch
          final productName = await _lookupProduct(barcodeValue);

          if (productName != null) {
            _accessibilityManager.speak('Sản phẩm: $productName');
            _historyService.addEntry(
              'barcode',
              'Sản phẩm: $productName ($barcodeValue)',
            );
          } else {
            _accessibilityManager.speak('Mã vạch: $barcodeValue');
            _historyService.addEntry('barcode', barcodeValue);
          }
          return;
        }
      }

      // Fallback to text recognition
      final recognizedText = await _textRecognizer.processImage(inputImage);
      if (recognizedText.text.trim().isNotEmpty) {
        _accessibilityManager.triggerSuccessVibration();
        _accessibilityManager.speak(recognizedText.text);
        _historyService.addEntry('text', recognizedText.text);
      } else {
        _accessibilityManager.speak('Không tìm thấy văn bản.');
      }
    } catch (e) {
      debugPrint("Error processing ML Kit image: $e");
      _accessibilityManager.triggerErrorVibration();
    } finally {
      await Future.delayed(const Duration(seconds: 2));
      _isProcessing = false;
    }
  }

  Future<String?> _lookupProduct(String barcode) async {
    try {
      // Dùng API miễn phí OpenFoodFacts làm thư viện data
      final uri = Uri.parse(
        'https://world.openfoodfacts.org/api/v0/product/$barcode.json',
      );
      final response = await http
          .get(
            uri,
            headers: {'User-Agent': 'AIVisionAssistant/1.0 - Android/iOS'},
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 1 && data['product'] != null) {
          // Lấy tên sản phẩm (ưu tiên tên tiếng Việt nếu có, nếu không lấy cấu hình mặc định)
          final productMap = data['product'] as Map<String, dynamic>;

          final nameStr =
              productMap['product_name_vi'] ??
              productMap['product_name_en'] ??
              productMap['product_name'];

          if (nameStr != null && nameStr.toString().trim().isNotEmpty) {
            return nameStr.toString();
          }
        }
      }
    } catch (e) {
      debugPrint('[MLKit] Error looking up barcode $barcode: $e');
    }
    return null;
  }
}
