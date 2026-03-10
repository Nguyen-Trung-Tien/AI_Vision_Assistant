class TextUtils {
  static String mapVietnameseRune(int rune) {
    switch (rune) {
      case 224:
      case 225:
      case 7841:
      case 7843:
      case 227:
      case 226:
      case 7847:
      case 7845:
      case 7853:
      case 7849:
      case 7851:
      case 259:
      case 7857:
      case 7855:
      case 7863:
      case 7859:
      case 7861:
        return 'a';
      case 232:
      case 233:
      case 7865:
      case 7867:
      case 7869:
      case 234:
      case 7873:
      case 7871:
      case 7879:
      case 7875:
      case 7877:
        return 'e';
      case 236:
      case 237:
      case 7883:
      case 7881:
      case 297:
        return 'i';
      case 242:
      case 243:
      case 7885:
      case 7887:
      case 245:
      case 244:
      case 7891:
      case 7889:
      case 7897:
      case 7893:
      case 7895:
      case 417:
      case 7901:
      case 7899:
      case 7907:
      case 7903:
      case 7905:
        return 'o';
      case 249:
      case 250:
      case 7909:
      case 7911:
      case 361:
      case 432:
      case 7915:
      case 7913:
      case 7921:
      case 7917:
      case 7919:
        return 'u';
      case 7923:
      case 253:
      case 7925:
      case 7927:
      case 7929:
        return 'y';
      case 273:
        return 'd';
      default:
        return String.fromCharCode(rune);
    }
  }

  static String normalizeCommand(String input) {
    final buffer = StringBuffer();
    for (final rune in input.toLowerCase().runes) {
      buffer.write(mapVietnameseRune(rune));
    }

    var s = buffer.toString();
    s = s.replaceAll(RegExp(r'[^a-z0-9\s]'), ' ');
    s = s.replaceAll(RegExp(r'\s+'), ' ').trim();
    return s;
  }

  static bool containsAny(String text, List<String> keywords) {
    for (final kw in keywords) {
      if (text.contains(kw)) return true;
    }
    return false;
  }
}
