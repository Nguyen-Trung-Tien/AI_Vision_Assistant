import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:archive/archive_io.dart';

class DocumentReaderService {
  final TextRecognizer _textRecognizer = TextRecognizer(
    script: TextRecognitionScript.latin,
  );

  Future<String?> pickAndExtractText() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      );

      if (result == null || result.files.single.path == null) {
        // Canceled
        return null;
      }

      String path = result.files.single.path!;
      String extension = result.files.single.extension?.toLowerCase() ?? '';

      if (extension == 'pdf') {
        return await _extractFromPdf(path);
      } else if (extension == 'docx') {
        return await _extractFromDocx(path);
      } else if (['jpg', 'jpeg', 'png'].contains(extension)) {
        return await _extractFromImage(path);
      } else {
        throw Exception('Unsupported format');
      }
    } catch (e) {
      throw Exception('Error: $e');
    }
  }

  Future<String> _extractFromPdf(String path) async {
    final bytes = await File(path).readAsBytes();
    final document = PdfDocument(inputBytes: bytes);
    String text = PdfTextExtractor(document).extractText();
    document.dispose();
    return text.trim();
  }

  Future<String> _extractFromDocx(String path) async {
    final bytes = await File(path).readAsBytes();
    final archive = ZipDecoder().decodeBytes(bytes);

    for (final file in archive) {
      if (file.name == 'word/document.xml') {
        if (file.isFile) {
          final data = file.content as List<int>;
          final xmlString = String.fromCharCodes(data);
          // Very basic XML tag stripping
          final stripped = xmlString
              .replaceAll(RegExp(r'<[^>]*>'), ' ')
              .replaceAll(RegExp(r'\s+'), ' ')
              .trim();
          return stripped;
        }
      }
    }
    return '';
  }

  Future<String> _extractFromImage(String path) async {
    final inputImage = InputImage.fromFilePath(path);
    final recognizedText = await _textRecognizer.processImage(inputImage);
    return recognizedText.text.trim();
  }

  void dispose() {
    _textRecognizer.close();
  }
}
