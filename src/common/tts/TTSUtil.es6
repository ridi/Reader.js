import _Util from '../_Util';

export default class TTSUtil {
  static find(list, callback) {
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (callback(item)) {
        return item;
      }
    }
    return null;
  }

  static _createRegex(prefix, pattern, suffix, flags) {
    return new RegExp(`${prefix || ''}${pattern || ''}${suffix || ''}`, flags || 'gm');
  }

  static getSplitWordRegex() {
    return _Util.getSplitWordRegex();
  }

  static getWhitespaceRegex(prefix, suffix, flags) {
    return this._createRegex(prefix, '[ \\u00A0]', suffix, flags);
  }

  static getNewLineRegex(prefix, suffix, flags) {
    return this._createRegex(prefix, '[\\r\\n]', suffix, flags);
  }

  static getWhitespaceAndNewLineRegex(prefix, suffix, flags) {
    return this._createRegex(prefix, '[\\t\\r\\n\\s\\u00A0]', suffix, flags);
  }

  static getSentenceRegex(prefix, suffix, flags) {
    /* eslint-disable no-useless-escape */
    return this._createRegex(prefix, '[.。?!\"”\'’」』〞〟]', suffix, flags);
    /* eslint-enable no-useless-escape */
  }

  // *** Char ***

  static isLastCharOfSentence(ch = '') {
    return ch.match(this.getSentenceRegex()) !== null;
  }

  static isDigitOrLatin(ch = '') {
    const code = ch.charCodeAt(0);
    return this.isLatinCharCode(code) || this.isDigitCharCode(code);
  }

  // '.'이 소수점 또는 영문이름을 위해 사용될 경우 true
  static isPeriodPointOrName(textWithPeriod, textAfterPeriod) {
    if (textWithPeriod === undefined || textAfterPeriod === undefined) {
      return false;
    }
    let hit = 0;
    let index = textWithPeriod.search(/[.](\s{0,})$/gm);
    if (index > 0 && this.isDigitOrLatin(textWithPeriod[index - 1])) {
      hit += 1;
    }
    index = textAfterPeriod.search(/[^\s]/gm);
    if (index >= 0 && this.isDigitOrLatin(textAfterPeriod[index])) {
      hit += 1;
    }
    return hit === 2;
  }

  // *** Bracket ***

  static getBrackets(text = '') {
    try {
      /* eslint-disable no-useless-escape */
      return text.match(/[\(\)\{\}\[\]]/gm) || [];
      /* eslint-enable no-useless-escape */
    } catch (e) {
      return [];
    }
  }

  static isOnePairBracket(open = '', close = '') {
    return (open + close).match(/\(\)|\{\}|\[\]/gm) !== null;
  }

  static mergeSentencesWithinBrackets(sentences = []) {
    const resultSentences = [];
    const brackets = [];
    sentences.forEach((sentence) => {
      const didBracketsExist = (brackets.length > 0);
      const newBrackets = this.getBrackets(sentence);
      newBrackets.forEach((newBracket) => {
        const lastBracket = brackets.pop();
        if (lastBracket) {
          if (!this.isOnePairBracket(lastBracket, newBracket)) {
            brackets.push(lastBracket);
            brackets.push(newBracket);
          }
        } else {
          brackets.push(newBracket);
        }
      });
      resultSentences.push((didBracketsExist ? resultSentences.pop() : '') + sentence);
    });

    if (brackets.length > 0) {
      /* eslint-disable no-console */
      console.error('Brackets does not match.');
      console.error({ sentences, brackets, resultSentences });
    }
    return resultSentences;
  }

  // *** CharCode ***

  static _containCharCode(code, table) {
    if (!isNaN(code)) {
      for (let i = 0; i < table.length; i += 2) {
        if (table[i] <= code && code <= table[i + 1]) {
          return true;
        }
      }
    }
    return false;
  }

  static isDigitCharCode(code) {
    return this._containCharCode(code, [0x0030, 0x0039]);
  }

  static isSpaceCharCode(code) {
    return code === 0x0020 || code === 0x00A0;
  }

  static isTildeCharCode(code) {
    return code === 0x007E || code === 0x223C || code === 0x301C; // ~, ∼, 〜
  }

  static isColonCharCode(code) {
    return code === 0x003A;
  }

  static hangulCodeTable() {
    return [
      0xAC00, 0xD7AF,
    ];
  }

  static isHangulCharCode(code) {
    return this._containCharCode(code, this.hangulCodeTable());
  }

  static latinCodeTable() {
    return [
      0x0020, 0x007F, // Latin Basic
      0x00A0, 0x00FF, // Latin Supplement
      0x0100, 0x017F, // Latin Extended-A
      0x0180, 0x024F, // Latin Extended-B
    ];
  }

  static isLatinCharCode(code, flag) {
    if (isNaN(code)) {
      return false;
    }

    if (code >= 0x0100 && code <= 0x017F) {
      // Latin Extended-A
      if (flag === 'u') {
        if ((code >= 0x0100 && code <= 0x0137 && code % 2 === 0) ||
          (code >= 0x014A && code <= 0x0177 && code % 2 === 0) ||
          (code >= 0x0139 && code <= 0x0148 && code % 2 === 1) ||
          (code >= 0x0179 && code <= 0x017E && code % 2 === 1)) {
          return true;
        } else if (code === 0x0178) {
          return true;
        }
      } else if (flag === 'l') {
        if ((code >= 0x0100 && code <= 0x0137 && code % 2 === 1) ||
          (code >= 0x014A && code <= 0x0177 && code % 2 === 1) ||
          (code >= 0x0139 && code <= 0x0148 && code % 2 === 0) ||
          (code >= 0x0179 && code <= 0x017E && code % 2 === 0)) {
          return true;
        } else if (code === 0x0138 || code === 0x0149 || code === 0x017F) {
          return true;
        }
      }
      return false;
    } else if (code >= 0x0180 && code <= 0x024F) {
      // TODO: Latin Extended-B(대소문자가 섞여있고 편집문자까지 들어가 있다... 후..)
      return true;
    }

    // Latin Basic
    const uppercaseTable = [0x0041, 0x005A, 0x00C0, 0x00D6, 0x00D8, 0x00DE];
    const lowercaseTable = [0x0061, 0x007A, 0x00DF, 0x00F6, 0x00F8, 0x00FF];
    let table;
    if (flag === 'u') {
      table = uppercaseTable;
    } else if (flag === 'l') {
      table = lowercaseTable;
    } else {
      table = [].concat(uppercaseTable).concat(lowercaseTable);
    }
    return this._containCharCode(code, table);
  }

  static chineseCodeTable() {
    return [
      0x4E00,
      0x9FFF, // CJK Unified Ideographs
      0xF900,
      0xFAFF, // CJK Compatibility Ideographs
      0x3300,
      0x33FF, // CJK Compatibility
      0x3400,
      0x4DBF, // CJK Unified Ideographs Extension A
      0x20000,
      0x2A6DF, // CJK Unified Ideographs Extension B
      0x2A700,
      0x2B73F, // CJK Unified Ideographs Extension C
      0x2B740,
      0x2B81F, // CJK Unified Ideographs Extension D
      0x2B820,
      0x2CEAF, // CJK Unified Ideographs Extension E
      0x2CEB0,
      0x2EBEF, // CJK Unified Ideographs Extension F
      0x2F800,
      0x2FA1F, // CJK Compatibility Ideographs Supplement
    ];
  }

  static isChineseCharCode(code) {
    return this._containCharCode(code, this.chineseCodeTable());
  }

  static japaneseCodeTable() {
    return [
      0x3000,
      0x303F, // Japanese-style punctuation
      0x3040,
      0x309F, // Hiragana
      0x30a0,
      0x30FF, // Katakana
      0xFF00,
      0xFFEF, // Full-width roman characters and half-width katakana
      0x4E00,
      0x9FFF, // CJK Unified Ideographs
    ];
  }

  static isJapaneseCharCode(code) {
    return this._containCharCode(code, this.japaneseCodeTable());
  }

  static getContainCharRegex(tables = []) {
    const toUnicode = (num) => {
      // FIXME: BMP를 벗어나는 애들 처리(http://ujinbot.blogspot.kr/2013/10/blog-post.html)
      if (num > 0xFFFF) {
        return null;
      }
      return String.fromCharCode(num);
    };
    let string = '[';
    tables.forEach((table) => {
      for (let i = 0; i < table.length; i += 2) {
        const lower = toUnicode(table[i]);
        const upper = toUnicode(table[i + 1]);
        if (lower && upper) {
          string += `${lower}-${upper}`;
        }
      }
    });
    string += ']';
    return new RegExp(`^${string}{1,}$`, 'gm');
  }

  // Hangel

  static getInitialCharCode(code) {
    //      ㄱ  ㄲ ㄴ  ㄷ  ㄸ ㄹ  ㅁ ㅂ  ㅃ  ㅅ ㅆ  ㅇ ㅈ  ㅉ ㅊ  ㅋ ㅌ  ㅍ ㅎ
    // 0x31 31 32 34 37 38 39 41 42 43 45 46 47 48 49 4A 4B 4C 4D 4E
    const codes = [
      0x31, 0x32, 0x34, 0x37, 0x38, 0x39, 0x41, 0x42, 0x43,
      0x46, 0x47, 0x48, 0x49, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E,
    ];
    return 0x3100 + codes[((((code - 0xAC00) - ((code - 0xAC00) % 28))) / 28) / 21];
  }

  static getMedialCharCodeIndex(code) {
    return ((((code - 0xAC00) - ((code - 0xAC00) % 28))) / 28) % 21;
  }

  static getMedialCharCode(code) {
    //      ㅏ  ㅐ  ㅑ ㅒ  ㅓ ㅔ  ㅕ ㅖ  ㅗ  ㅘ ㅙ  ㅚ ㅛ ㅜ  ㅝ  ㅞ ㅟ  ㅠ ㅡ  ㅢ  ㅣ
    // 0x31 4F 50 51 52 53 54 55 56 57 58 59 5A 5B 5C 5D 5E 5F 60 61 62 63
    const codes = [
      0x4F, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58,
      0x59, 0x5A, 0x5B, 0x5C, 0x5D, 0x5E, 0x5F, 0x60, 0x61, 0x62, 0x63,
    ];
    const index = this.getMedialCharCodeIndex(code);
    return 0x3100 + codes[index];
  }

  static getFinalCharCode(code) {
    //             ㄱ  ㄲ ㄳ  ㄴ ㄵ  ㄶ  ㄷ ㄹ  ㄺ ㄻ  ㄼ  ㄽ ㄾ  ㄿ ㅀ  ㅁ ㅂ  ㅄ  ㅅ ㅆ  ㅇ ㅈ  ㅊ ㅋ  ㅌ  ㅍ ㅎ
    // 0x0000 0x31 31 32 33 34 35 36 37 39 3A 3B 3C 3D 3E 3F 40 41 42 44 45 46 47 48 4A 4B 4C 4D 4E
    const codes = [
      0x00, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x39, 0x3A,
      0x3B, 0x3C, 0x3D, 0x3E, 0x3F, 0x40, 0x41, 0x42, 0x44, 0x45,
      0x46, 0x47, 0x48, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E,
    ];
    const index = (code - 0xAC00) % 28;
    return (index === 0 ? 0x0000 : 0x3100) + codes[index];
  }

  // *** Numeric ***

  // 기(양)수사 : 수량을 쓸 때 쓰는 수사
  static numericToNotationString(num, isHangul = true) {
    let ones;
    let tens;
    let teens;
    if (isHangul) {
      ones = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
      tens = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
      teens = ['십', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    } else {
      ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
      tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty',
        'sixty', 'seventy', 'eighty', 'ninety'];
      teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
        'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    }

    const convertTens = (_num) => {
      if (_num < 10) {
        return ones[_num];
      } else if (!isHangul && _num >= 10 && _num < 20) {
        return teens[_num - 10];
      }
      if (isHangul && _num < 10 * 2) {
        return `십${ones[_num % 10]}`;
      }
      const unit = isHangul ? '십' : ' ';
      return `${tens[Math.floor(_num / 10)]}${unit}${ones[_num % 10]}`;
    };

    const convertHundreds = (_num) => {
      if (_num > 99) {
        if (isHangul && _num < 100 * 2) {
          return `백${convertTens(_num % 100)}`;
        }
        const unit = isHangul ? '백' : ' hundred ';
        return `${ones[Math.floor(_num / 100)]}${unit}`
             + `${convertTens([_num % 100])}`;
      }
      return convertTens(_num);
    };

    const convertThousands = (_num) => {
      if (_num >= 1000) {
        if (isHangul && _num < 1000 * 2) {
          return `천${convertHundreds(_num % 1000)}`;
        }
        const unit = isHangul ? '천' : ' thousand ';
        return `${convertThousands(Math.floor(_num / 1000))}${unit}`
             + `${convertHundreds([_num % 1000])}`;
      }
      return convertHundreds(_num);
    };

    const convertMillions = (_num) => {
      const base = isHangul ? 10000 : 1000000;
      if (_num >= base) {
        if (isHangul && _num < base * 2) {
          return `만${convertThousands(_num % base)}`;
        }
        const unit = isHangul ? '만' : ' million ';
        return `${convertMillions(Math.floor(_num / base))}${unit}`
             + `${convertThousands([_num % base])}`;
      }
      return convertThousands(_num);
    };

    if (num === 0) {
      return isHangul ? '영' : 'zero';
    }
    return convertMillions(num).trim();
  }

  // 서수사 : 순서를 나타내는 수사(영문은 지원 안함)
  static numericToOrdinalString(num, suffix = '') {
    const ones = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
    const tens = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
    const teens = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];

    const c = suffix.match(/^(명|공|달|시|종|벌|채|갈|쾌|근|문|큰|살|째)(?!러)/gm) !== null;
    if (!c && suffix.length) {
      return null;
    }

    const convertTens = (_num) => {
      if (_num < 10) {
        return ones[_num];
      }
      const unit = c ? ones[_num % 10] : tens[_num % 10];
      return `${teens[Math.floor(_num / 10)]}${unit}`;
    };

    const convertHundreds = (_num) => {
      if (_num > 99) {
        if (_num < 100 * 2) {
          return `백${convertTens(_num % 100)}`;
        }
        return `${this.numericToNotationString(Math.floor(_num / 100))}백`
             + `${convertTens(_num % 100)}`;
      }
      return convertTens(_num);
    };

    const convertThousands = (_num) => {
      if (_num >= 1000) {
        if (_num < 1000 * 2) {
          return `천${convertHundreds(_num % 1000)}`;
        }
        return `${this.numericToNotationString(Math.floor(_num / 1000))}천`
             + `${convertHundreds(_num % 1000)}`;
      }
      return convertHundreds(_num);
    };

    const convertMillions = (_num) => {
      if (_num >= 10000) {
        if (_num < 10000 * 2) {
          return `만${convertThousands(_num % 10000)}`;
        }
        return `${this.numericToNotationString(Math.floor(_num / 10000))}만`
             + `${convertThousands(_num % 10000)}`;
      }
      return convertThousands(_num);
    };

    if (num === 0) {
      return null;
    }
    return convertMillions(num);
  }
}
