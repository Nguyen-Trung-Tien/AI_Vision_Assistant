import 'dart:convert';
import 'package:http/http.dart' as http;

class ProductLookupService {
  static const String _baseUrl =
      'https://world.openfoodfacts.org/api/v0/product';

  /// Tra cứu thông tin Barcode.
  /// Trả về chuỗi tổng hợp thông tin sản phẩm (gồm tên, danh mục, v.v.)
  /// Nếu không tìm thấy, trả về null.
  static Future<String?> lookupBarcode(
    String barcode, {
    String lang = "vi",
  }) async {
    try {
      final url = Uri.parse('$_baseUrl/$barcode.json');
      final response = await http.get(url).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 1 && data['product'] != null) {
          final product = data['product'];

          // Lấy tên sản phẩm
          String? name =
              product['product_name_$lang'] ??
              product['product_name'] ??
              product['generic_name'];

          if (name == null || name.isEmpty) return null;

          // Lấy thương hiệu
          String? brand = product['brands'];

          // Tổng hợp chuỗi
          String result = name;
          if (brand != null &&
              brand.isNotEmpty &&
              !name.toLowerCase().contains(brand.toLowerCase())) {
            result += ' của hãng $brand';
          }

          // Lấy khối lượng đóng gói (ví dụ: 500g, 1L)
          String? quantity = product['quantity'];
          if (quantity != null && quantity.isNotEmpty) {
            result += ', loại $quantity';
          }

          return result;
        }
      }
      return null;
    } catch (e) {
      print('[ProductLookupService] Error looking up barcode $barcode: $e');
      return null;
    }
  }
}
