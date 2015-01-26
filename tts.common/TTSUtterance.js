// TTSUtterance

function TTSUtterance(/*String*/text) {
  this.text = text;
  this.length = text.length;
  setReadOnly(this, ['text', 'length'], true);
}

TTSUtterance.prototype = {
  // 개행문자는 읽을 때 잡음으로 변환되기 때문에 제거한다.
  removeNewLine: function() {
    return new TTSUtterance(this.text.replace(regexNewLine(), ' '));
  },

  // 한자 단독으로 쓰이기보다 한글음과 같이 쓰일 때가 많아 중복 발음을 없애기 위해 한자를 제거한다.
  // TODO - 한자 단독으로 쓰일 때 처리하기
  removeHanja: function() {
    var text = this.text;
    for (var i = 0; i < this.length; i++) {
      if (isChineseCharCode(text.charCodeAt(i)))
        text = text.replace(text.substr(i, 1), ' ');
    }
    return new TTSUtterance(text);
  },

  // 한글과 영문이 붙어 있을 때 이후에 오는 문자가 공백, 마침표를 의미한다거나 한글과 영문이 붙어 있다면, 영문을 제거한다.
  removeLatin: function() {
    var removeList = [];
    var text = this.text;
    var textLength = this.length;
    var startOffset = -1, endOffset = -1, i, j, k;
    var ch, nextCh;
    var prevCode, code, nextCode;

    var checkRemoveRange = function(start, end) {
      // 한 글자 이상일 때만 제거한다.
      if (end - start > 1) {
        removeList.push({startOffset: start, endOffset: end});
      }
      startOffset = -1;
    };

    for (i = 0; i < textLength; i++) {
      code = text.charCodeAt(i);
      if (0 < i && isLatinCharCode(code)) {
        var isAbbr = false;
        prevCode = text.charCodeAt(i - 1);
        if (i + 1 < textLength) {
          // 한글 옆에 붙은애는 알고보니 축약어였다!? -> 야는 제거해선 안 된다.
          nextCode = text.charCodeAt(i + 1);
          isAbbr = isLatinCharCode(code, 'u') & isLatinCharCode(nextCode, 'u');
        }
        if (!isAbbr && isHangulCharCode(prevCode)) {
          // 영어의 전 글자는 반드시 한글이어야 한다.
          startOffset = i;
        }
        if (startOffset > 0) {
          for (j = i + 1; j < textLength; j++) {
            code = text.charCodeAt(j);
            ch = text.charAt(j);
            if (isSpaceCharCode(code) || isLastCharOfSentence(ch) || ch == ':' || ch == ',') {
              // 공백, 문장의 끝을 의미하는 문자일 때는 좀 더 이후 글자를 확인한다.
              if (j + 1 < textLength) {
                var ignoreCount = 1;
                for (k = j + 1; k < textLength; k++) {
                  nextCode = text.charCodeAt(k);
                  nextCh = text.charAt(k);
                  if (isSpaceCharCode(nextCode) || nextCh == ':' || nextCh == ',') {
                    ignoreCount++;
                    continue;
                  } else if (isLatinCharCode(nextCode)) {
                    j = k;
                    break;
                  } else {
                    checkRemoveRange(startOffset, k - ignoreCount);
                    j = k - ignoreCount;
                    break;
                  }
                }// end for
              } else {
                checkRemoveRange(startOffset, j);
              }
            } else if (!isLatinCharCode(code)) {
              // 영문, 공백, 문장의 끝을 의미하는 문자가 아닐 때는 영문의 끝으로 간주한다.
              if (j + 1 < textLength) {
                nextCode = text.charCodeAt(j + 1);
                if (isLatinCharCode(nextCode)) {
                  j++;
                  continue;
                }
              }
              checkRemoveRange(startOffset, j);
            }
            if (startOffset == -1) {
              break;
            }
          }// end for
          if (startOffset != -1) {
            checkRemoveRange(startOffset, textLength);
          }
        }
      }
    }// end for

    var result = '';
    for (i = 0, startOffset = 0, endOffset = 0; i < removeList.length; i++) {
      endOffset = removeList[i].startOffset;
      result += text.substring(startOffset, endOffset);
      startOffset = removeList[i].endOffset;
    }
    result += text.substring(startOffset, textLength);

    return new TTSUtterance(result);
  },

  // 한글에 틸드 문자가 붙을 경우 소리를 늘리는 의미기에 자모에 맞춰 늘려준다.
  replaceTilde: function() {
    var extendTable = ['아', '에', '아', '에', '어',
                       '에', '어', '에', '오', '아',
                       '에', '에', '오', '우', '어',
                       '에', '이', '우', '으', '으', '이'];
    var text = this.text;
    var textLength = this.length;
    var offset = -1, j;
    for (var i = 0; i < textLength; i++) {
      var code = text.charCodeAt(i);
      if (isTildeCharCode(code)) {
        if (i > 0) {
          var isRangeTilde = false;// 범위를 의미하는 틸드일 때는 바꾸지 않는다. (3억~5억)
          for (j = i + 1; j < textLength; j++) {
            var nextCode = text.charCodeAt(j);
            if (isSpaceCharCode(nextCode)) {
              continue;
            } else if (isDigitCharCode(nextCode)) {
              isRangeTilde = true;
              break;
            } else
              break;
          }// end for
          if (!isRangeTilde) {
            for (j = i - 1; j >= 0; j--) {
              var prevCode = text.charCodeAt(j);
              if (isHangulCharCode(prevCode) && getFinalCharCodeInHangulCharCode(prevCode) === 0x0000) {
                // 틸드의 뒷문자가 한글일 때는 앞문자의 자모에 맞춰 틸드를 바꿔준다. (와~ -> 와아)
                // 단, 받침이 없는 한글이어야 한다.
                var medialCodeIndex = getMedialCharCodeIndexInHangulCharCode(prevCode);
                text = text.replace(text.substr(i, 1), extendTable[medialCodeIndex]);
                offset = i;
                break;
              } else if (isLatinCharCode(prevCode)) {
                // 틸드의 뒷문자가 영문일 때는 앞문자와 같게 틸드를 바꿔준다. (Oh~ -> Ohh)
                text = text.replace(text.substr(i, 1), text.substr(j, 1));
                offset = i;
                break;
              } else
                  break;
            }// end for
          }
        }
      }
    }// end for

    // 쉼표를 줘서 다음 문장 또는 단어와 바로 이어지지 않도록 한다.
    if (offset != -1) {
      var k;
      var insertRest = true;
      for (k = offset + 1; k < textLength; k++) {
        if (isHangulCharCode(text.charCodeAt(k))) {
          insertRest = false;
          break;
        } else if (text[k] != '?' && text[k] != '!')
          break;
      }
      if (insertRest) {
        if (textLength <= k)
          text += ',';
        else
          text = text.substr(0, k) + ',' + text.substr(k);
      }
    }

    // '~'가 아닌 '∼'와 '〜'는 사용자 사전(CP949)에서 커버할 수 없어서 수동으로 바꿔준다.
    text = text.replace('∼', '에서 ');
    text = text.replace('〜', '에서 ');

    return new TTSUtterance(text);
  },

  replaceNumeric: function() {
    var TYPE = {
      NONE: -1, LATION: 0, HANGUL_NOTATION: 1, HANGUL_ORDINAL: 2, TIME: 3
    };
    var match, pattern;
    var i, code, ch, string;
    var startOffset, endOffset;
    var text = this.text;

    // 천단위 ','를 지워버린다.
    text = text.replace(/([\d]{0,})[,]([\d]{3,})/gm, "$1$2");

    // 사용자 사전(CP949)에서 커버할 수 없어서 수동으로 바꿔준다.
    text = text.replace(/⅐/gm, "칠 분의 일");
    text = text.replace(/⅑/gm, "구 분의 일");
    text = text.replace(/⅒/gm, "십 분의 일");
    text = text.replace(/⅓/gm, "삼 분의 일");
    text = text.replace(/⅔/gm, "삼 분의 이");
    text = text.replace(/⅕/gm, "오 분의 일");
    text = text.replace(/⅖/gm, "오 분의 이");
    text = text.replace(/⅗/gm, "오 분의 삼");
    text = text.replace(/⅘/gm, "오 분의 사");
    text = text.replace(/⅙/gm, "육 분의 일");
    text = text.replace(/⅚/gm, "육 분의 오");
    text = text.replace(/⅛/gm, "팔 분의 일");
    text = text.replace(/⅜/gm, "팔 분의 삼");
    text = text.replace(/⅝/gm, "팔 분의 오");
    text = text.replace(/⅞/gm, "팔 분의 칠");

    // 년도를 의미하는 숫자 뒤에 XX가 붙어 있다면 0으로 교체한다.
    text = text.replace(/([\d]{1,2})[Xx×]{2}/gm, "$100");

    // 숫자를 문맥에 따라 기수 또는 서수로 바꿔준다.
    pattern = /[\d]{1,}/gm;
    while ((match = pattern.exec(text)) !== null) {
      startOffset = match.index;
      endOffset = pattern.lastIndex;
      var numeric = parseInt(text.substring(startOffset, endOffset), 10);
      var type = (startOffset === 0 ? TYPE.HANGUL_NOTATION : TYPE.NONE);
      var spaceCount = 0;
      for (i = startOffset - 1; i >= 0; i--) {
        code = text.charCodeAt(i);
        if (isSpaceCharCode(code)) {
          spaceCount++;
          continue;
        } else if (isColonCharCode(code)) {
          type = TYPE.TIME;
          break;
        } else if (i < startOffset - 1 && isLatinCharCode(code)) {
          type = TYPE.LATION;
          break;
        } else {
          type = TYPE.NONE;
          break;
        }
      }
      if (spaceCount == startOffset) {
        type = TYPE.HANGUL_NOTATION;
      }
      for (i = endOffset; i < text.length; i++) {
        code = text.charCodeAt(i);
        ch = text.charAt(i);
        if (isSpaceCharCode(code)) {
          continue;
        } else if (type == TYPE.TIME || isColonCharCode(code)) {
          type = TYPE.TIME;
          break;
        } else if (endOffset < i && (type == TYPE.LATION || isLatinCharCode(code))) {
          type = TYPE.LATION;
          break;
        } else if (type != TYPE.LATION && ch == '.') {
          type = TYPE.NONE;
          break;
        } else if (ch == '장' || ch == '권') {
          type = TYPE.HANGUL_NOTATION;
          break;
        } else if (isLastCharOfSentence(ch)) {
          break;
        } else if (i == endOffset && (ch = numericToOrdinalString(numeric, ch)) !== null) {
          type = TYPE.HANGUL_ORDINAL;
          break;
        } else {
          type = TYPE.NONE;
          break;
        }
      }
      if (type == TYPE.HANGUL_NOTATION || type == TYPE.HANGUL_ORDINAL || type == TYPE.LATION) {
        if (type == TYPE.HANGUL_ORDINAL) {
          string = ch;
        } else {
          string = numericToNotationString(numeric, type);
        }
        text = text.substr(0, startOffset) + string + text.substr(endOffset);
      } else {
        text = text.substr(0, startOffset) + numeric + text.substr(endOffset);
      }
    }

    return new TTSUtterance(text);
  },

  // 소괄호를 읽지 못하게 했지만 읽어야할 경우가 있기 때문에 이를 보정해준다.
  replaceBracket: function() {
    var text = this.text;
    var match, pattern = /\([\d]{1,2}\)/gm;
    while ((match = pattern.exec(text)) !== null) {
      var startOffset = match.index;
      var endOffset = pattern.lastIndex;
      var string = text.substring(startOffset + 1, endOffset - 1);
      if (startOffset === 0 || (0 <= startOffset - 1 && text.substr(startOffset - 1, 1) == ' ')) {
        text = text.substr(0, startOffset) + '[' + string + ']' + text.substr(endOffset);
      }
    }
    text = text.replace(/\(([가나다라마바사아자차카타파하OX])\)/gm, '[$1]');
    return new TTSUtterance(text);
  },

  // 판타지 소설에서 '=' 문자로 구분선을 만들기 때문에 사용자 사전에 넣지는 못하고 수동으로.. '=' 하나만
  replaceEqual: function() {
    return new TTSUtterance(this.text.replace(/([^=])([=]{1})([^=])/gm, '$1는 $3'));
  },

  // TODO - 영문 월을 한글로 변환하기
  replaceDate: function() {
    // var abbrMonth = ["jan", "feb", "mar", "may", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    // var fullMonth = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

    return new TTSUtterance(this.text);
  },

  // 말줄임표, 쉼표를 의미하는 문자는 정말 쉬게 만들어준다.
  insertPauseTag: function() {
    var text = this.text;
    text = text.replace(/([\D])([·]{1,})([\D])/gm, '$1<pause=\"200ms\">$2$3');
    text = text.replace(/([|_]{1})/gm, '<pause=\"200ms\">$1');
    text = text.replace(/([…]{1,})/gm, '<pause=\"500ms\">$1');
    text = text.replace(/([\D])(-|―){1,}([\D])/gm, '$1<pause=\"500ms\">$2$3');
    text = text.replace(/^([\s]{0,}[\d]{1,}[\s]{1,})([^-―·|…_<])/gm, '$1<pause=\"500ms\">$2');
    return new TTSUtterance(text);
  }
};
