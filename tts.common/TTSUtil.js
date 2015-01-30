// TTSUtil

// Property

function setReadOnly(/*Object*/obj, /*Array<String>*/properties, /*Boolean*/readOnly) {
  properties.forEach(function(property) {
    Object.defineProperty(obj, property, {
      writable: !readOnly
    });
  });
}

// Regex

function regex(/*String*/prefix, /*String*/pattern, /*String*/suffix, /*String*/flags) {
  prefix = typeof prefix === 'string' ? prefix : '';
  suffix = typeof suffix === 'string' ? suffix : '';
  flags = typeof flags === 'string' ? flags : 'gm';
  return new RegExp(prefix + pattern + suffix, flags);
}

function regexSplitWhitespace(/*String*/prefix, /*String*/suffix, /*String*/flags) {
  return regex(prefix, ' |\\u00A0', suffix, flags);
}

function regexWhitespace(/*String*/prefix, /*String*/suffix, /*String*/flags) {
  return regex(prefix, '[ \\u00A0]', suffix, flags);
}

function regexNewLine(/*String*/prefix, /*String*/suffix, /*String*/flags) {
  return regex(prefix, '[\\r\\n]', suffix, flags);
}

function regexWhitespaceAndNewLine(/*String*/prefix, /*String*/suffix, /*String*/flags) {
  return regex(prefix, '[\\t\\r\\n\\s\\u00A0]', suffix, flags);
}

function regexSentence(/*String*/prefix, /*String*/suffix, /*String*/flags) {
  return regex(prefix, '[.。?!\"”\'’」』〞〟]', suffix, flags);
}

// Char

function isLastCharOfSentence(/*Char*/ch) {
  return ch.match(regexSentence()) !== null;
}

function isDigitOrLatin(/*Char*/ch) {
  if (ch) {
    var code = ch.charCodeAt(0);
    return isLatinCharCode(code) || isDigitCharCode(code);
  } else
    return false;
}

function getFirstOpenBracket(/*String*/text) {
  try {
    return text.match(/[\({\[]/gm)[0];
  } catch(e) {
    return null;
  }
}

function getLastCloseBracket(/*String*/text) {
  try {
    return text.match(/[\)}\]]/gm).pop();
  } catch(e) {
    return null;
  }
}

function isOnePairBracket(/*Char*/open, /*Char*/close) {
  return (open + close).match(/\(\)|{}|\[\]/gm) !== null;
}

// CharCode

function isCharCodeWithinTable(/*Array<Number>*/table, /*Number*/code) {
  for (var i = 0; i < table.length; i += 2) {
    if (table[i] <= code && code <= table[i + 1])
      return true;
  }
  return false;
}

function isDigitCharCode(/*Number*/code) {
  return isCharCodeWithinTable([0x0030, 0x0039], code);
}

function isSpaceCharCode(/*Number*/code) {
  return code == 0x0020 || code == 0x00A0;
}

function isTildeCharCode(/*Number*/code) {
  return code == 0x007E || code == 0x223C || code == 0x301C;// ~, ∼, 〜
}

function isColonCharCode(/*Number*/code) {
  return code == 0x003A;
}

function isHangulCharCode(/*Number*/code) {
  return isCharCodeWithinTable([0xAC00, 0xD7AF], code);
}

function isLatinCharCode(/*Number*/code, /*String*/flag) {
  var table;
  var uppercaseTable = [0x0041, 0x005A, 0x00C0, 0x00D6, 0x00D8, 0x00DE];
  var lowercaseTable = [0x0061, 0x007A, 0x00DF, 0x00F6, 0x00F8, 0x00FF];
  if (code >= 0x0100 && code <= 0x017F) {
    // Latin Extended-A
    if (flag == 'u') {
      if ((code >= 0x0100 && code <= 0x0137 && code % 2 === 0) || 
          (code >= 0x014A && code <= 0x0177 && code % 2 === 0) || 
          (code >= 0x0139 && code <= 0x0148 && code % 2 == 1) || 
          (code >= 0x0179 && code <= 0x017E && code % 2 == 1)) {
        return true;
      }
      else if (code == 0x0178) {
        return true;
      }
    } else if (flag == 'l') {
      if ((code >= 0x0100 && code <= 0x0137 && code % 2 == 1) || 
          (code >= 0x014A && code <= 0x0177 && code % 2 == 1) ||
          (code >= 0x0139 && code <= 0x0148 && code % 2 === 0) || 
          (code >= 0x0179 && code <= 0x017E && code % 2 === 0)) {
        return true;
      }
      else if (code == 0x0138 || code == 0x0149 || code == 0x017F) {
        return true;
      }
    }
    return false;
  } else if (code >= 0x0180 && code <= 0x024F) {
    // Latin Extended-B... 대소문자가 섞여있고 편집문자까지 들어가 있다...
    // TODO 나중에 구분해주자...
    return true;
  } else {
    // Latin Basic
    if (flag == 'u')
      table = uppercaseTable;
    else if (flag == 'l')
      table = lowercaseTable;
    else
      table = [].concat(uppercaseTable).concat(lowercaseTable);
    return isCharCodeWithinTable(table, code);
  }
}

function isChineseCharCode(/*Number*/code) {
  return isCharCodeWithinTable([0x4E00,  0x9FBF, 
                                0xF900,  0xFAFF, 
                                0x3400,  0x4DBF, 
                                0x20000, 0x2A6DF, 
                                0x2A700, 0x2B73F, 
                                0x2B740, 0x2B81F, 
                                0x2F800, 0x2FA1F], code);
}

// Hangel

function getInitialCharCodeInHangulCharCode(/*Number*/code) {
  //      ㄱ  ㄲ ㄴ  ㄷ  ㄸ ㄹ  ㅁ ㅂ  ㅃ  ㅅ ㅆ  ㅇ ㅈ  ㅉ ㅊ  ㅋ ㅌ  ㅍ ㅎ
  // 0x31 31 32 34 37 38 39 41 42 43 45 46 47 48 49 4A 4B 4C 4D 4E
  var initialCodes = [0x31, 0x32, 0x34, 0x37, 0x38, 0x39, 0x41, 0x42, 0x43, 0x46, 
                      0x47, 0x48, 0x49, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E];
  return 0x3100 + initialCodes[((((code - 0xAC00) - (code - 0xAC00) % 28)) / 28) / 21];
}

function getMedialCharCodeIndexInHangulCharCode(/*Number*/code) {
  return ((((code - 0xAC00) - (code - 0xAC00) % 28)) / 28) % 21;
}

function getMedialCharCodeInHangulCharCode(/*Number*/code) {
  //      ㅏ  ㅐ  ㅑ ㅒ  ㅓ ㅔ  ㅕ ㅖ  ㅗ  ㅘ ㅙ  ㅚ ㅛ ㅜ  ㅝ  ㅞ ㅟ  ㅠ ㅡ  ㅢ  ㅣ
  // 0x31 4F 50 51 52 53 54 55 56 57 58 59 5A 5B 5C 5D 5E 5F 60 61 62 63
  var medialCodes = [0x4F, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 
                     0x59, 0x5A, 0x5B, 0x5C, 0x5D, 0x5E, 0x5F, 0x60, 0x61, 0x62, 0x63];
  var index = getMedialCharCodeIndexInHangulCharCode(code);
  return 0x3100 + medialCodes[index];
}

function getFinalCharCodeInHangulCharCode(/*Number*/code) {
  //             ㄱ  ㄲ ㄳ  ㄴ ㄵ  ㄶ  ㄷ ㄹ  ㄺ ㄻ  ㄼ  ㄽ ㄾ  ㄿ ㅀ  ㅁ ㅂ  ㅄ  ㅅ ㅆ  ㅇ ㅈ  ㅊ ㅋ  ㅌ  ㅍ ㅎ
  // 0x0000 0x31 31 32 33 34 35 36 37 39 3A 3B 3C 3D 3E 3F 40 41 42 44 45 46 47 48 4A 4B 4C 4D 4E
  var finalCodes = [0x00, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x39, 0x3A, 
                    0x3B, 0x3C, 0x3D, 0x3E, 0x3F, 0x40, 0x41, 0x42, 0x44, 0x45, 
                    0x46, 0x47, 0x48, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E];
  var index = (code - 0xAC00) % 28;
  return (index === 0 ? 0x0000 : 0x3100) + finalCodes[index];
}

// Numeric

// 기(양)수사 : 수량을 쓸 때 쓰는 수사
function numericToNotationString(/*Number*/num, /*Boolean*/isHangul) {
  var ones, tens, teens;
  if (isHangul) {
    ones = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    tens = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    teens = ['십', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  } else {
    ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  }

  var convertTens = function(num) {
    if (num < 10) {
      return ones[num];
    } else if (!isHangul && num >= 10 && num < 20) {
      return teens[num - 10];
    } else {
        if (isHangul && num < 10 * 2) {
          return '십' + ones[num % 10];
        }
        return tens[Math.floor(num / 10)] + (isHangul ? '십' : ' ') + ones[num % 10];
    }
  };

  var convertHundreds = function(num) {
    if (num > 99) {
      if (isHangul && num < 100 * 2) {
        return '백' + convertTens(num % 100);
      }
      return ones[Math.floor(num / 100)] + (isHangul ? '백' : ' hundred ') + convertTens(num % 100);
    } else
      return convertTens(num);
  };

  var convertThousands = function(num) {
    if (num >= 1000) {
      if (isHangul && num < 1000 * 2) {
        return '천' + convertHundreds(num % 1000);
      }
      return convertThousands(Math.floor(num / 1000)) + (isHangul ? '천' : ' thousand ') + convertHundreds(num % 1000);
    } else
      return convertHundreds(num);
  };

  var convertMillions = function(num) {
    var base = isHangul ? 10000 : 1000000;
    if (num >= base) {
      if (isHangul && num < base * 2) {
        return '만' + convertThousands(num % base);
      }
      return convertMillions(Math.floor(num / base)) + (isHangul ? '만' : ' million ') + convertThousands(num % base);
    } else
        return convertThousands(num);
  };

  if (num === 0) {
    return isHangul ? '영' : 'zero';
  } else {
    return convertMillions(num).trim();
  }
}

// 서수사 : 순서를 나타내는 수사(영문은 지원 안함)
function numericToOrdinalString(/*Number*/num, /*String*/suffix) {
  var ones = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
  var tens = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
  var teens = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];

  var c = suffix !== undefined && suffix.match(/^(명|공|달|시|종|벌|채|갈|쾌|근|문|큰|살|째)(?!러)/gm) !== null;
  if (!c && suffix !== undefined) {
    return null;
  }

  var convertTens = function(num) {
    if (num < 10)
      return ones[num];
    else
      return teens[Math.floor(num / 10)] + (c ? ones[num % 10] : tens[num % 10]);
  };

  var convertHundreds = function(num) {
    if (num > 99) {
      if (num < 100 * 2) {
        return '백' + convertTens(num % 100);
      }
      return numericToNotationString(Math.floor(num / 100), true) + '백' + convertTens(num % 100);
    } else
      return convertTens(num);
  };

  var convertThousands = function(num) {
      if (num >= 1000) {
        if (num < 1000 * 2) {
          return '천' + convertHundreds(num % 1000);
        }
        return numericToNotationString(Math.floor(num / 1000), true) + '천' + convertHundreds(num % 1000);
      }
      else
        return convertHundreds(num);
  };

  var convertMillions = function(num) {
    if (num >= 10000) {
      if (num < 10000 * 2) {
        return '만' + convertThousands(num % 10000);
      }
      return numericToNotationString(Math.floor(num / 10000), true) + '만' + convertThousands(num % 10000);
    }
    else
      return convertThousands(num);
  };

  if (num === 0) {
    return null;
  } else {
    return convertMillions(num);
  }
}
