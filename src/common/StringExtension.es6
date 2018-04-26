(() => {
  const latinCode = {
    basic: {
      start: [
        { value: 0x0061, type: 'l' },
        { value: 0x0041, type: 'u' },
      ],
      end: [
        { value: 0x007a, type: 'l' },
        { value: 0x005a, type: 'u' },
      ],
    },
    supplement: {
      start: [
        { value: 0x00df, type: 'l' },
        { value: 0x00f8, type: 'l' },
        { value: 0x00c0, type: 'u' },
        { value: 0x00d8, type: 'u' },
      ],
      end: [
        { value: 0x00f6, type: 'l' },
        { value: 0x00ff, type: 'l' },
        { value: 0x00d6, type: 'u' },
        { value: 0x00de, type: 'u' },
      ],
    },
    extendedA: { start: 0x0100, end: 0x017f },
    extendedB: { start: 0x0180, end: 0x024f },
  };

  const chineseCode = {
    basic: { start: 0x4e00, end: 0x9fff },
    compatibility1: { start: 0xf900, end: 0xfaff },
    compatibility2: { start: 0x3300, end: 0x33ff },
    extendedA: { start: 0x3400, end: 0x4dbf },
    extendedB: { start: 0x20000, end: 0x2a6df },
    extendedC: { start: 0x2a700, end: 0x2b73f },
    extendedD: { start: 0x2b740, end: 0x2b81f },
    extendedE: { start: 0x2b820, end: 0x2ceaf },
    extendedF: { start: 0x2ceb0, end: 0x2ebef },
    supplement: { start: 0x2f800, end: 0x2fa1f },
  };

  const japaneseCode = {
    basic: { start: 0x3000, end: 0x303f },
    hiragana: { start: 0x3040, end: 0x309f },
    katakana: { start: 0x30a0, end: 0x30ff },
    fullWidthRomanWithHalfWidthKatakana: { start: 0xff00, end: 0xffef },
    hanja: chineseCode.basic,
  };

  const hangulCode = { basic: { start: 0xac00, end: 0xd7af } };

  const digitCode = { basic: { start: 0x0030, end: 0x0039 } };

  [latinCode, chineseCode, japaneseCode, hangulCode, digitCode].forEach((object) => {
    const codeMap = object;
    const names = Object.getOwnPropertyNames(codeMap);
    names.forEach((name) => {
      codeMap[name].contain = function f(code, flag) {
        if (isNaN(code)) {
          return false;
        }
        if (typeof this.start === 'object' && typeof this.end === 'object') {
          const { length } = this.start;
          for (let i = 0; i < length; i += 1) {
            let start = this.start[i].value;
            let end = this.end[i].value;
            if (flag !== undefined && this.start[i].type !== flag) {
              start = 0xffffff;
            }
            if (flag !== undefined && this.end[i].type !== flag) {
              end = -0xffffff;
            }
            if (start <= code && code <= end) {
              return true;
            }
          }
          return false;
        }
        return this.start <= code && code <= this.end;
      };
    });
    codeMap.contain = function f(code, flag) {
      return names.find((name) => {
        if (typeof codeMap[name] === 'function') {
          return false;
        }
        return codeMap[name].contain(code, flag);
      }) !== undefined;
    };
  });

  function isNumber() {
    return /^\d+$/.test(this);
  }

  function _isLatinCharAt(idx, string, flag) {
    const code = string.charCodeAt(idx);

    if (latinCode.extendedA.contain(code)) {
      if (flag === 'u') {
        if ((code >= 0x0100 && code <= 0x0137 && code % 2 === 0) ||
          (code >= 0x014a && code <= 0x0177 && code % 2 === 0) ||
          (code >= 0x0139 && code <= 0x0148 && code % 2 === 1) ||
          (code >= 0x0179 && code <= 0x017e && code % 2 === 1)) {
          return true;
        } else if (code === 0x0178) {
          return true;
        }
      } else if (flag === 'l') {
        if ((code >= 0x0100 && code <= 0x0137 && code % 2 === 1) ||
          (code >= 0x014a && code <= 0x0177 && code % 2 === 1) ||
          (code >= 0x0139 && code <= 0x0148 && code % 2 === 0) ||
          (code >= 0x0179 && code <= 0x017e && code % 2 === 0)) {
          return true;
        } else if (code === 0x0138 || code === 0x0149 || code === 0x017f) {
          return true;
        }
      }
      return flag === undefined;
    } else if (latinCode.extendedB.contain(code)) {
      // TODO: Latin Extended-B(대소문자가 섞여있고 편집문자까지 들어가 있다... 후..)
      return true;
    }

    return latinCode.basic.contain(code, flag) || latinCode.supplement.contain(code, flag);
  }

  function isUpperLatinCharAt(idx) {
    return _isLatinCharAt(idx, this, 'u');
  }

  function isLowerLatinCharAt(idx) {
    return _isLatinCharAt(idx, this, 'l');
  }

  function isLatinCharAt(idx) {
    return _isLatinCharAt(idx, this);
  }

  function isChineseCharAt(idx) {
    return chineseCode.contain(this.charCodeAt(idx));
  }

  function isJapaneseCharAt(idx) {
    return japaneseCode.contain(this.charCodeAt(idx));
  }

  function isHangulCharAt(idx) {
    return hangulCode.contain(this.charCodeAt(idx));
  }

  function isColonCharAt(idx) {
    return this.charCodeAt(idx) === 0x003a;
  }

  function isTildeCharAt(idx) {
    const code = this.charCodeAt(idx);
    return [0x007e/* ~ */, 0x223c/* ∼ */, 0x301c/* 〜 */].find(item => item === code) !== undefined;
  }

  function isSpaceCharAt(idx) {
    const code = this.charCodeAt(idx);
    return [0x0020, 0x00a0].find(item => item === code) !== undefined;
  }

  function isDigitCharAt(idx) {
    return digitCode.contain(this.charCodeAt(idx));
  }

  function isFilled(...args) {
    const codeList = [];
    args.forEach((arg) => {
      if (arg === 'latin') {
        codeList.push(latinCode);
      } else if (arg === 'chinese') {
        codeList.push(chineseCode);
      } else if (arg === 'japanese') {
        codeList.push(japaneseCode);
      } else if (arg === 'hangul') {
        codeList.push(hangulCode);
      } else if (arg === 'digit') {
        codeList.push(digitCode);
      }
    });
    const toUnicode = (num) => {
      // TODO: BMP를 벗어나는 애들 처리(http://ujinbot.blogspot.kr/2013/10/blog-post.html)
      if (num > 0xffff) {
        return null;
      }
      return String.fromCharCode(num);
    };
    let string = '[';
    codeList.forEach((codeMap) => {
      const names = Object.getOwnPropertyNames(codeMap);
      names.forEach((name) => {
        let { start } = codeMap[name];
        let { end } = codeMap[name];
        if (typeof start === 'object' && typeof end === 'object') {
          const { length } = start;
          for (let i = 0; i < length; i += 1) {
            const startValue = toUnicode(start[i].value);
            const endValue = toUnicode(end[i].value);
            if (startValue && endValue) {
              string += `${startValue}-${endValue}`;
            }
          }
        } else if (`${start}`.isNumber() && `${end}`.isNumber()) {
          start = toUnicode(start);
          end = toUnicode(end);
          if (start && end) {
            string += `${start}-${end}`;
          }
        }
      });
    });
    string += ']';
    return new RegExp(`^${string}{1,}$`, 'gm').test(this);
  }

  function isDigitOrLatinCharAt(idx) {
    return this.isDigitCharAt(idx) || this.isLatinCharAt(idx);
  }

  function replaceAt(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
  }

  const hangulMap = { final: [], medial: [], initial: [] };
  const hangulKeys = ['final', 'medial', 'initial'];
  [
    [
      '',
      'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ',
      'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ',
      'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
    ], // 28
    [
      'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
      'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ',
      'ㅣ',
    ], // 21
    [
      'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
      'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
    ], // 19
  ].forEach((chunk, keyIdx) => {
    chunk.forEach((ch) => {
      hangulMap[hangulKeys[keyIdx]].push({
        ch,
        code: ch.length > 0 ? ch.charCodeAt(0) - 0x3100 : 0x0000,
      });
    });
  });

  function getHangulComponentsAt(idx) {
    const code = this.charCodeAt(idx) - 0xac00;
    const finalIdx = code % 28;
    const medialIdx = ((code - finalIdx) / 28) % 21;
    const initialIdx = (((code - finalIdx) / 28) - medialIdx) / 21;
    return {
      initial: initialIdx >= 0 && medialIdx >= 0 ? hangulMap.initial[initialIdx].code + 0x3100 : undefined,
      initialIdx: initialIdx >= 0 && medialIdx >= 0 ? initialIdx : undefined,
      medial: medialIdx >= 0 ? hangulMap.medial[medialIdx].code + 0x3100 : undefined,
      medialIdx: medialIdx >= 0 ? medialIdx : undefined,
      final: finalIdx > 0 ? hangulMap.final[finalIdx].code + 0x3100 : undefined,
      finalIdx: finalIdx > 0 ? finalIdx : undefined,
    };
  }

  function replaceHangulComponentsAt(idx, initial, medial, final) {
    function fromCodeIdx(any, type) {
      let code = 0;
      if (any === undefined) {
        return undefined;
      } else if (typeof any === 'string') {
        code = any.charCodeAt(0);
      } else if (`${any}`.isNumber()) {
        code = any;
      }
      if ((type === 0 && code >= 0x3131 && code <= 0x314e)
        || (type === 1 && code >= 0x314f && code <= 0x3163)
        || (type === 2 && code >= 0x3131 && code <= 0x314e)) {
        code -= 0x3100;
      } else {
        return undefined;
      }
      const codeIdx = hangulMap[hangulKeys[type]].findIndex(item => item.code === code);
      if (codeIdx < 0) {
        return undefined;
      }
      return codeIdx;
    }

    if (!this.isHangulCharAt(idx)) {
      return this;
    }

    const current = this.getHangulComponentsAt(idx);
    const initialIdx = fromCodeIdx(initial || current.initial, 2);
    const medialIdx = fromCodeIdx((medial === ' ' ? '' : medial) || current.medial, 1);
    const finalIdx = fromCodeIdx((typeof final === 'string' && final.length === 0 ? ' ' : final) || current.final, 0);
    if (initialIdx === undefined && medialIdx === undefined) {
      return this;
    }

    const ch = String.fromCharCode(0xac00 + (21 * 28 * initialIdx) + (28 * medialIdx) + (finalIdx || 0));
    return this.replaceAt(idx, ch);
  }

  const define = (key, func) => {
    const { prototype } = String;
    if (!prototype[key]) {
      prototype[key] = func;
    }
  };

  define('isNumber', isNumber);
  define('isUpperLatinCharAt', isUpperLatinCharAt);
  define('isLowerLatinCharAt', isLowerLatinCharAt);
  define('isLatinCharAt', isLatinCharAt);
  define('isChineseCharAt', isChineseCharAt);
  define('isJapaneseCharAt', isJapaneseCharAt);
  define('isHangulCharAt', isHangulCharAt);
  define('isColonCharAt', isColonCharAt);
  define('isTildeCharAt', isTildeCharAt);
  define('isSpaceCharAt', isSpaceCharAt);
  define('isDigitCharAt', isDigitCharAt);
  define('isFilled', isFilled);
  define('isDigitOrLatinCharAt', isDigitOrLatinCharAt);
  define('replaceAt', replaceAt);
  define('getHangulComponentsAt', getHangulComponentsAt);
  define('replaceHangulComponentsAt', replaceHangulComponentsAt);
})();
