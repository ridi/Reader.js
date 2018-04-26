import _Util from '../_Util';

export default class TTSUtil {
  /**
   * @param {TTSPiece[]} list
   * @param {function} callback
   * @returns {TTSPiece|null}
   */
  static find(list, callback) {
    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      if (callback(item)) {
        return item;
      }
    }
    return null;
  }

  /**
   * @param {String} prefix
   * @param {String} pattern
   * @param {String} suffix
   * @param {String} flags
   * @returns {RegExp}
   * @private
   */
  static _createRegex(prefix, pattern, suffix, flags) {
    return new RegExp(`${prefix || ''}${pattern || ''}${suffix || ''}`, flags || 'gm');
  }

  /**
   * @returns {RegExp}
   */
  static getSplitWordRegex() {
    return _Util.getSplitWordRegex();
  }

  /**
   * @param {String} prefix
   * @param {String} suffix
   * @param {String} flags
   * @returns {RegExp}
   */
  static getWhitespaceRegex(prefix, suffix, flags) {
    return this._createRegex(prefix, '[ \\u00A0]', suffix, flags);
  }

  /**
   * @param {String} prefix
   * @param {String} suffix
   * @param {String} flags
   * @returns {RegExp}
   */
  static getNewLineRegex(prefix, suffix, flags) {
    return this._createRegex(prefix, '[\\r\\n]', suffix, flags);
  }

  /**
   * @param {String} prefix
   * @param {String} suffix
   * @param {String} flags
   * @returns {RegExp}
   */
  static getWhitespaceAndNewLineRegex(prefix, suffix, flags) {
    return this._createRegex(prefix, '[\\t\\r\\n\\s\\u00A0]', suffix, flags);
  }

  /**
   * @param {String} prefix
   * @param {String} suffix
   * @param {String} flags
   * @returns {RegExp}
   */
  static getSentenceRegex(prefix, suffix, flags) {
    /* eslint-disable no-useless-escape */
    return this._createRegex(prefix, '[.。?!\"”\'’」』〞〟]', suffix, flags);
    /* eslint-enable no-useless-escape */
  }

  // *** Char ***

  /**
   * @param {String} ch
   * @returns {Boolean}
   */
  static isLastCharOfSentence(ch = '') {
    return ch.match(this.getSentenceRegex()) !== null;
  }

  /**
   * '.'이 소수점 또는 영문이름을 위해 사용될 경우 true
   *
   * @param {String} textWithPeriod
   * @param {String} textAfterPeriod
   * @returns {Boolean}
   */
  static isPeriodPointOrName(textWithPeriod, textAfterPeriod) {
    if (textWithPeriod === undefined || textAfterPeriod === undefined) {
      return false;
    }
    let hit = 0;
    let index = textWithPeriod.search(/[.](\s{0,})$/gm);
    if (index > 0 && textWithPeriod.isDigitOrLatinCharAt(index - 1)) {
      hit += 1;
    }
    index = textAfterPeriod.search(/[^\s]/gm);
    if (index >= 0 && textAfterPeriod.isDigitOrLatinCharAt(index)) {
      hit += 1;
    }
    return hit === 2;
  }

  // *** Bracket ***

  /**
   * @param {String} text
   * @returns {String}
   */
  static getBrackets(text = '') {
    try {
      /* eslint-disable no-useless-escape */
      return text.match(/[\(\)\{\}\[\]]/gm) || [];
      /* eslint-enable no-useless-escape */
    } catch (e) {
      return [];
    }
  }

  /**
   * @param {String} open
   * @param {String} close
   * @returns {Boolean}
   */
  static isOnePairBracket(open = '', close = '') {
    return (open + close).match(/\(\)|\{\}|\[\]/gm) !== null;
  }

  /**
   * @param {String[]} sentences
   * @returns {String[]}
   */
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

  // *** Numeric ***

  /**
   * 기(양)수사 : 수량을 쓸 때 쓰는 수사
   *
   * @param {Number} num
   * @param {Boolean} isHangul
   * @returns {String}
   */
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

  /**
   * 서수사 : 순서를 나타내는 수사(영문은 지원 안함)
   *
   * @param {Number} num
   * @param {String} suffix
   * @returns {String|null}
   */
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
