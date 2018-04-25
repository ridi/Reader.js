import TTSUtil from './TTSUtil';

export default class TTSUtterance {
  /**
   * @returns {String}
   */
  get text() { return this._text; }

  /**
   * @returns {Number}
   */
  get length() { return this._length; }

  /**
   * @param {String} text
   */
  constructor(text) {
    this._text = text;
    this._length = text.length;
  }

  /**
   * 개행문자는 읽을 때 잡음으로 변환되기 때문에 제거한다.
   *
   * @returns {TTSUtterance}
   */
  removeNewLine() {
    return new TTSUtterance(this.text.replace(TTSUtil.getNewLineRegex(), ' '));
  }

  /**
   * 읽지 말아야할 특수문자를 제거한다.
   * (사용자 사전으로 처리할 수 없기 때문에 코드로)
   *
   * @param {String[]} characters
   * @returns {TTSUtterance}
   */
  removeSpecialCharacters(characters) {
    const regex = new RegExp(`[${characters.join('')}]`, 'gm');
    return new TTSUtterance(this.text.replace(regex, ' '));
  }

  /**
   * 한자 단독으로 쓰이기보다 한글음과 같이 쓰일 때가 많아 중복 발음을 없애기 위해 한자를 제거한다.
   * TODO: 한자 단독으로 쓰일 때 처리하기
   *
   * @returns {TTSUtterance}
   */
  removeHanja() {
    let { text } = this;
    for (let i = 0; i < this.length; i += 1) {
      if (TTSUtil.isChineseCharCode(text.charCodeAt(i))) {
        text = text.replace(text.substr(i, 1), ' ');
      }
    }
    return new TTSUtterance(text);
  }

  /**
   * // 한글과 영문이 붙어 있을 때 이후에 오는 문자가 공백, 마침표를 의미한다거나 한글과 영문이 붙어 있다면, 영문을 제거한다.
   *
   * @returns {TTSUtterance}
   */
  removeLatin() {
    const removeList = [];
    const { text, length } = this;
    let startOffset = -1;
    let i;
    let j;
    let k;
    let ch;
    let nextCh;
    let prevCode;
    let code;
    let nextCode;

    const checkRemoveRange = (start, end) => {
      if (end - start > 1) {
        removeList.push({ startOffset: start, endOffset: end });
      }
      startOffset = -1;
    };

    for (i = 0; i < length; i += 1) {
      code = text.charCodeAt(i);
      if (i > 0 && TTSUtil.isLatinCharCode(code)) {
        let isAbbr = false;
        prevCode = text.charCodeAt(i - 1);
        if (i + 1 < length) {
          // 한글 옆에 붙은애는 알고보니 축약어였다!? -> 야는 제거해선 안 된다.
          nextCode = text.charCodeAt(i + 1);
          isAbbr = TTSUtil.isLatinCharCode(code, 'u') && TTSUtil.isLatinCharCode(nextCode, 'u');
        }
        if (!isAbbr && TTSUtil.isHangulCharCode(prevCode)) {
          // 영어의 전 글자는 반드시 한글이어야 한다.
          startOffset = i;
        }
        if (startOffset > 0) {
          for (j = i + 1; j < length; j += 1) {
            code = text.charCodeAt(j);
            ch = text.charAt(j);
            if (TTSUtil.isSpaceCharCode(code) || TTSUtil.isLastCharOfSentence(ch) ||
              ch === ':' || ch === ',') {
              // 공백, 문장의 끝을 의미하는 문자일 때는 좀 더 이후 글자를 확인한다.
              if (j + 1 < length) {
                let ignoreCount = 1;
                for (k = j + 1; k < length; k += 1) {
                  nextCode = text.charCodeAt(k);
                  nextCh = text.charAt(k);
                  if (TTSUtil.isSpaceCharCode(nextCode) || nextCh === ':' || nextCh === ',') {
                    ignoreCount += 1;
                  } else if (TTSUtil.isLatinCharCode(nextCode)) {
                    j = k;
                    break;
                  } else {
                    checkRemoveRange(startOffset, k - ignoreCount);
                    j = k - ignoreCount;
                    break;
                  }
                } // end for k
              } else {
                checkRemoveRange(startOffset, j);
              }
            } else if (!TTSUtil.isLatinCharCode(code)) {
              // 영문, 공백, 문장의 끝을 의미하는 문자가 아닐 때는 영문의 끝으로 간주한다.
              if (j + 1 < length) {
                nextCode = text.charCodeAt(j + 1);
                if (TTSUtil.isLatinCharCode(nextCode)) {
                  j += 1;
                  continue;
                }
              }
              checkRemoveRange(startOffset, j);
            }
            if (startOffset === -1) {
              break;
            }
          } // end for j
          if (startOffset !== -1) {
            checkRemoveRange(startOffset, length);
          }
        }
      }
    } // end for i

    let result = '';
    let endOffset = 0;
    for (i = 0, startOffset = 0; i < removeList.length; i += 1) {
      endOffset = removeList[i].startOffset;
      result += text.substring(startOffset, endOffset);
      startOffset = removeList[i].endOffset;
    }
    result += text.substring(startOffset, length);

    return new TTSUtterance(result);
  }

  /**
   * 한글에 틸드 문자가 붙을 경우 소리를 늘리는 의미기에 자모에 맞춰 늘려준다.
   *
   * @returns {TTSUtterance}
   */
  replaceTilde() {
    const extendTable = [
      '아', '에', '아', '에', '어',
      '에', '어', '에', '오', '아',
      '에', '에', '오', '우', '어',
      '에', '이', '우', '으', '으', '이',
    ];
    const textLength = this.length;
    let { text } = this;
    let offset = -1;
    let i;
    let j;
    let k;
    for (i = 0; i < textLength; i += 1) {
      const code = text.charCodeAt(i);
      if (TTSUtil.isTildeCharCode(code)) {
        if (i > 0) {
          let isRangeTilde = false;// 범위를 의미하는 틸드일 때는 바꾸지 않는다. (3억~5억)
          for (j = i + 1; j < textLength; j += 1) {
            const nextCode = text.charCodeAt(j);
            if (TTSUtil.isSpaceCharCode(nextCode)) {
              continue;
            } else if (TTSUtil.isDigitCharCode(nextCode)) {
              isRangeTilde = true;
              break;
            } else {
              break;
            }
          } // end for j
          if (!isRangeTilde) {
            const prevCode = text.charCodeAt(i - 1);
            if (TTSUtil.isHangulCharCode(prevCode) &&
              TTSUtil.getFinalCharCode(prevCode) === 0x0000) {
              // 틸드의 뒷문자가 한글일 때는 앞문자의 자모에 맞춰 틸드를 바꿔준다. (와~ -> 와아)
              // 단, 받침이 없는 한글이어야 한다.
              const index = TTSUtil.getMedialCharCodeIndex(prevCode);
              text = text.replace(text.substr(i, 1), extendTable[index]);
              offset = i;
            } else if (TTSUtil.isLatinCharCode(prevCode)) {
              // 틸드의 뒷문자가 영문일 때는 앞문자와 같게 틸드를 바꿔준다. (Oh~ -> Ohh)
              text = text.replace(text.substr(i, 1), text.substr(i - 1, 1));
              offset = i;
            }
          }
        }
      }
    } // end for i

    // 쉼표를 줘서 다음 문장 또는 단어와 바로 이어지지 않도록 한다.
    if (offset !== -1) {
      let insertRest = true;
      for (k = offset + 1; k < textLength; k += 1) {
        if (TTSUtil.isHangulCharCode(text.charCodeAt(k))) {
          insertRest = false;
          break;
        } else if (text[k] !== '?' && text[k] !== '!') {
          break;
        }
      }
      if (insertRest) {
        if (textLength <= k) {
          text += ',';
        } else {
          text = `${text.substr(0, k)},${text.substr(k)}`;
        }
      }
    }

    // '~'가 아닌 '∼'와 '〜'는 사용자 사전(CP949)에서 커버할 수 없어서 수동으로 바꿔준다.
    text = text.replace(/∼|〜/gm, () => '에서 ');

    return new TTSUtterance(text);
  }

  /**
   * @param {String[]} strs
   * @returns {TTSUtterance}
   */
  removeAllRepeatedCharacter(strs) {
    let { text } = this;
    for (let i = 0; i < strs.length; i += 1) {
      const regex = new RegExp(`${strs[i]}{2,}`, 'gm');
      text = text.replace(regex, '');
    }
    return new TTSUtterance(text);
  }

  /**
   * @returns {TTSUtterance}
   */
  replaceNumeric() {
    const Type = {
      None: -1,
      Latin: 0,
      HangulNotation: 1,
      HangulOrdinal: 2,
      Time: 3,
    };
    let { text } = this;

    // 천단위 ','를 지워버린다.
    text = text.replace(/([\d]{0,})[,]([\d]{3,})/gm, '$1$2');

    // 사용자 사전(CP949)에서 커버할 수 없어서 수동으로 바꿔준다.
    const map = {
      '⅐': '칠 분의 일',
      '⅑': '구 분의 일',
      '⅒': '십 분의 일',
      '⅓': '삼 분의 일',
      '⅔': '삼 분의 이',
      '⅕': '오 분의 일',
      '⅖': '오 분의 이',
      '⅗': '오 분의 삼',
      '⅘': '오 분의 사',
      '⅙': '육 분의 일',
      '⅚': '육 분의 오',
      '⅛': '팔 분의 일',
      '⅜': '팔 분의 삼',
      '⅝': '팔 분의 오',
      '⅞': '팔 분의 칠',
    };
    text = text.replace(/⅐|⅑|⅒|⅓|⅔|⅕|⅖|⅗|⅘|⅙|⅚|⅛|⅜|⅝|⅞/gm, matched => map[matched]);

    // 년도를 의미하는 숫자 뒤에 XX가 붙어 있다면 0으로 교체한다.
    text = text.replace(/([\d]{1,2})[Xx×]{2}/gm, '$100');

    // 숫자를 문맥에 따라 기수 또는 서수로 바꿔준다.
    const pattern = /[\d]{1,}/gm;
    let match;
    let startOffset;
    let endOffset;
    let i;
    let code;
    let ch;
    while ((match = pattern.exec(text)) !== null) {
      startOffset = match.index;
      endOffset = pattern.lastIndex;
      const origin = text.substring(startOffset, endOffset);
      const numeric = parseInt(origin, 10);
      if (!isFinite(numeric)) {
        continue;
      }
      let type = (startOffset === 0 ? Type.HangulNotation : Type.None);
      let spaceCount = 0;
      for (i = startOffset - 1; i >= 0; i -= 1) {
        code = text.charCodeAt(i);
        if (TTSUtil.isSpaceCharCode(code)) {
          spaceCount += 1;
        } else if (TTSUtil.isColonCharCode(code)) {
          type = Type.Time;
          break;
        } else if (i < startOffset - 1 && TTSUtil.isLatinCharCode(code, 'l')) {
          type = Type.Latin;
          break;
        } else {
          type = Type.None;
          break;
        }
      }

      if (spaceCount === startOffset) {
        type = Type.HangulNotation;
      }

      for (i = endOffset; i < text.length; i += 1) {
        code = text.charCodeAt(i);
        ch = text.charAt(i);
        const nextCh = text.charAt(i + 1);
        if (TTSUtil.isSpaceCharCode(code)) {
          continue;
        } else if (type === Type.Time || TTSUtil.isColonCharCode(code)) {
          type = Type.Time;
          break;
        } else if (endOffset < i && (type === Type.Latin || TTSUtil.isLatinCharCode(code, 'l'))) {
          type = Type.Latin;
          break;
        } else if (type !== Type.Latin && ch === '.') {
          type = Type.None;
          break;
        } else if (ch === '장' || ch === '권') {
          type = Type.HangulNotation;
          break;
        } else if (TTSUtil.isLastCharOfSentence(ch)) {
          break;
        } else if (i === endOffset &&
          (ch = TTSUtil.numericToOrdinalString(numeric, ch + nextCh)) !== null) {
          type = Type.HangulOrdinal;
          break;
        } else {
          type = Type.None;
          break;
        }
      }

      let string;
      if (type === Type.HangulNotation || type === Type.HangulOrdinal || type === Type.Latin) {
        if (type === Type.HangulOrdinal) {
          string = ch;
        } else {
          string = TTSUtil.numericToNotationString(numeric, type !== Type.Latin);
        }
      } else {
        string = origin;
      }
      text = `${text.substr(0, startOffset)}${string}${text.substr(endOffset)}`;
    }

    return new TTSUtterance(text);
  }

  /**
   * 소괄호를 읽지 못하게 했지만 읽어야할 경우가 있기 때문에 이를 보정해준다.
   *
   * @returns {TTSUtterance}
   */
  replaceBracket() {
    const pattern = /\([\d]{1,2}\)/gm;
    let { text } = this;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const startOffset = match.index;
      const endOffset = pattern.lastIndex;
      const string = text.substring(startOffset + 1, endOffset - 1);
      if (startOffset === 0 || (startOffset - 1 >= 0 && text.substr(startOffset - 1, 1) === ' ')) {
        text = `${text.substr(0, startOffset)}[${string}]${text.substr(endOffset)}`;
      }
    }
    text = text.replace(/\(([가나다라마바사아자차카타파하OX])\)/gm, '[$1]');
    return new TTSUtterance(text);
  }

  /**
   * 판타지 소설에서 '=' 문자로 구분선을 만들기 때문에 사용자 사전에 넣지는 못하고 수동으로.. '=' 하나만
   *
   * @returns {TTSUtterance}
   */
  replaceEqual() {
    return new TTSUtterance(this.text.replace(/([^=])([=]{1})([^=])/gm, '$1는 $3'));
  }

  /**
   * TODO: 영문 월을 한글로 변환하기
   *
   * @returns {TTSUtterance}
   */
  replaceDate() {
    // const abbrMonth = [
    //   "jan", "feb", "mar", "may", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec"
    // ];
    // const fullMonth = [
    //   "january", "february", "march", "april", "may", "june",
    //   "july", "august", "september", "october", "november", "december"
    // ];
    return new TTSUtterance(this.text);
  }

  /**
   * 말줄임표, 쉼표를 의미하는 문자는 정말 쉬게 만들어준다.
   *
   * @returns {TTSUtterance}
   */
  insertPauseTag() {
    let { text } = this;
    text = text.replace(/([\D])([·]{2,})([\D])/gm, '$1<pause=\'200ms\'>$2$3');
    text = text.replace(/([|_]{1})/gm, '<pause=\'400ms\'>$1');
    text = text.replace(/([…]{1,})/gm, '<pause=\'400ms\'>$1');
    text = text.replace(/([\D])(-|―){1,}([\D])/gm, '$1<pause=\'200ms\'>$2$3');
    text = text.replace(/^([\s]{0,}[\d]{1,}[\s]{1,})([^-―·|…_<])/gm, '$1<pause=\'200ms\'>$2');
    return new TTSUtterance(text);
  }
}
