import 'dart:convert';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:archive/archive_io.dart';

class DocumentReaderService {
  final TextRecognizer _textRecognizer = TextRecognizer(
    script: TextRecognitionScript.latin,
  );

  Future<List<String>?> pickAndExtractPages({void Function()? onFilePicked}) async {
    try {
      FilePickerResult? result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
      );

      if (result == null || result.files.single.path == null) {
        // Canceled
        return null;
      }

      // Trigger callback as soon as file is picked
      onFilePicked?.call();

      String path = result.files.single.path!;
      String extension = result.files.single.extension?.toLowerCase() ?? '';

      if (extension == 'pdf') {
        return await _extractFromPdf(path);
      } else if (extension == 'docx' || extension == 'doc') {
        return await _extractFromDocx(path);
      } else if (extension == 'txt') {
        return await _extractFromTextFile(path);
      } else if (['jpg', 'jpeg', 'png'].contains(extension)) {
        return await _extractFromImage(path);
      } else {
        throw Exception('Unsupported format');
      }
    } catch (e) {
      throw Exception('Error: $e');
    }
  }

  Future<List<String>> _extractFromTextFile(String path) async {
    final file = File(path);
    return [await file.readAsString()];
  }

  String _cleanExtractedText(String input) {
    if (input.isEmpty) return input;
    
    // 1. Chuẩn hóa xuống dòng
    var clean = input.replaceAll('\r\n', '\n');
    
    // Các ký tự tiếng Việt có dấu phức tạp
    final vSpec = r'áàãạảăắằẵặẳâấầẫậẩđéèẽẹẻêếềễệểíìĩịỉóòõọỏôốồỗộổơớờỡợởúùũụủưứừữựửýỳỹỵỷÁÀÃẠẢĂẮẰẴẶẲÂẤẦẪẬẨĐÉÈẼẸẺÊẾỀỄỆỂÍÌĨỊỈÓÒÕỌỎÔỐỒỖỘỔƠỚỜỠỢỞÚÙŨỤỦƯỨỪỮỰỬÝỲỸỴỶ';
    
    // 2. Gom các chữ bị rách (như PDF spacing)
    List<String> lines = clean.split('\n');
    for (int i = 0; i < lines.length; i++) {
      String line = lines[i].trim();
      int spaceCount = line.split(' ').length - 1;
      
      // Nếu tỉ lệ khoảng trắng cao (dấu hiệu của lỗi split chữ trong PDF)
      if (line.isNotEmpty && (spaceCount / line.length > 0.18)) {
        String previous;
        do {
          previous = line;
          // Xoá khoảng trắng trước V_SPEC nếu trước đó là chữ
          line = line.replaceAllMapped(RegExp('([a-zA-Z$vSpec]) +([$vSpec])'), (m) => '${m.group(1)}${m.group(2)}');
          // Xoá khoảng trắng sau V_SPEC nếu sau đó là chữ
          line = line.replaceAllMapped(RegExp('([$vSpec]) +([a-zA-Z$vSpec])'), (m) => '${m.group(1)}${m.group(2)}');
        } while (line != previous);
        
        // Sau khi gom chữ tiếng Việt, dọn dẹp các khoảng trắng thừa còn lại
        line = line.replaceAll(RegExp(r'[ \t]{2,}'), ' ');
        lines[i] = line;
      }
    }
    
    clean = lines.join('\n');
    
    // 3. Sửa lỗi xuống dòng rời rạc (câu bị ngắt dòng lung tung)
    // Giữ lại các ngắt đoạn thực sự (2+ newlines)
    clean = clean.replaceAll(RegExp(r'\n{2,}'), '|||PARAGRAPH|||');
    
    // Thay các xuống dòng đơn lẻ thành khoảng trắng để liền câu
    clean = clean.replaceAll('\n', ' ');
    
    // Khôi phục ngắt đoạn
    clean = clean.replaceAll('|||PARAGRAPH|||', '\n\n');
    
    // Dọn dẹp khoảng trắng thừa
    clean = clean.replaceAll(RegExp(r'[ \t]{2,}'), ' ');
    
    return clean.trim();
  }

  Future<List<String>> _extractFromPdf(String path) async {
    final bytes = await File(path).readAsBytes();
    final document = PdfDocument(inputBytes: bytes);
    final extractor = PdfTextExtractor(document);
    List<String> pages = [];
    
    for (int i = 0; i < document.pages.count; i++) {
      String pageText = extractor.extractText(startPageIndex: i, endPageIndex: i).trim();
      pages.add(_cleanExtractedText(pageText));
    }
    
    document.dispose();
    return pages;
  }

  Future<List<String>> _extractFromDocx(String path) async {
    final bytes = await File(path).readAsBytes();
    final archive = ZipDecoder().decodeBytes(bytes);

    for (final file in archive) {
      if (file.name == 'word/document.xml') {
        if (file.isFile) {
          final data = file.content as List<int>;
          // Use utf8.decode instead of fromCharCodes to prevent Vietnamese text corruption
          final xmlString = utf8.decode(data, allowMalformed: true);
          
          // Preserving paragraphs by replacing </w:p> with double newline
          var stripped = xmlString.replaceAll(RegExp(r'</w:p>'), '\n\n');
          
          // Strip all remaining XML tags
          stripped = stripped.replaceAll(RegExp(r'<[^>]*>'), '');
          
          return [_cleanExtractedText(stripped)];
        }
      }
    }
    return [''];
  }

  Future<List<String>> _extractFromImage(String path) async {
    final inputImage = InputImage.fromFilePath(path);
    final recognizedText = await _textRecognizer.processImage(inputImage);
    return [recognizedText.text.trim()];
  }

  void dispose() {
    _textRecognizer.close();
  }
}
