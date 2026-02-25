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
        final barcodeValues = barcodes
            .map((b) => b.displayValue)
            .where((v) => v != null)
            .join(', ');
        if (barcodeValues.isNotEmpty) {
          _accessibilityManager.triggerSuccessVibration();
          _accessibilityManager.speak('Mã vạch: $barcodeValues');
          _historyService.addEntry('barcode', barcodeValues);
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
}
