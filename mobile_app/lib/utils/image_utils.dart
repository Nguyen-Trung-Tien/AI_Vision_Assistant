import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as imglib;

class ImageUtils {
  static Future<Uint8List?> convertMapToJpeg(
    Map<String, dynamic> imageData,
  ) async {
    try {
      if (imageData['formatGroup'] == 0) {
        // yuv420
        return _convertYUV420MapToJpeg(imageData);
      } else if (imageData['formatGroup'] == 1) {
        // bgra8888
        return _convertBGRA8888MapToJpeg(imageData);
      }
    } catch (e) {
      debugPrint('Error converting camera image: $e');
    }
    return null;
  }

  static Uint8List? _convertYUV420MapToJpeg(Map<String, dynamic> imageData) {
    try {
      final width = imageData['width'] as int;
      final height = imageData['height'] as int;
      final planes = imageData['planes'] as List<dynamic>;

      final yRowStride = planes[0]['bytesPerRow'] as int;
      final uvRowStride = planes[1]['bytesPerRow'] as int;
      final uvPixelStride = (planes[1]['bytesPerPixel'] ?? 1) as int;

      final yBytes = planes[0]['bytes'] as Uint8List;
      final uBytes = planes[1]['bytes'] as Uint8List;
      final vBytes = planes[2]['bytes'] as Uint8List;

      final image = imglib.Image(
        width: width,
        height: height,
        format: imglib.Format.uint8,
      );

      for (int w = 0; w < width; w++) {
        for (int h = 0; h < height; h++) {
          final uvIndex = uvPixelStride * (w ~/ 2) + uvRowStride * (h ~/ 2);
          final index = h * yRowStride + w;

          final y = yBytes[index];
          final u = uBytes[uvIndex];
          final v = vBytes[uvIndex];

          image.setPixelRgba(w, h, y, u, v, 255);
        }
      }

      return imglib.encodeJpg(image, quality: 60);
    } catch (e) {
      debugPrint('YUV conversion error: $e');
      return null;
    }
  }

  static Uint8List? _convertBGRA8888MapToJpeg(Map<String, dynamic> imageData) {
    try {
      final width = imageData['width'];
      final height = imageData['height'];
      final planes = imageData['planes'] as List<dynamic>;
      final bytes = planes[0]['bytes'] as Uint8List;

      final image = imglib.Image.fromBytes(
        width: width,
        height: height,
        bytes: bytes.buffer,
        order: imglib.ChannelOrder.bgra,
      );
      return imglib.encodeJpg(image, quality: 60);
    } catch (e) {
      debugPrint('BGRA conversion error: $e');
      return null;
    }
  }
}
