// tts.js

//
// * TTS 노트.
//
//    * 문단 나누기 규칙.
//
//    1. 텍스트가 없는 노드는 무시한다.
//    2. 읽을 수 없는 문자만 가지고 있는 노드는 무시한다.
//        - space(\s), newline(\n), tab(\t), retrun carriage(\r) 등 공백문자는 읽을 수 없다.
//    3. 노드의 형제(Silbing) 중에 br 노드가 있을 때는 Chunk로 만든다.
//        - 마침표 또는 문장의 끝을 의미하는 문자 없이 newline 또는 br 태그가 쓰일 경우는 제목, 주제 등 의미를 부여하는 의도적인 줄 바꿈이기에 하나의 문장으로 봐야한다.
//             예) <h2>'성공하고 싶다'를<br>'행복해지고 싶다'로<br>바꾸자</h2>
//    4. 이미지 노드는 alt 속성에 한 자 이상의 문자가 있을 때만 Chunk로 만든다.
//        - 단, 접미에 이미지 파일 확장자가 있다면 무시한다. (이미지 파일명을 넣은 출판사가 종종 있다)
//        - alt가 있는데 0자일 때가 있다.
//             예) <img id="cover" src="front_cover.jpg" alt="">
//    5. 후리가나를 표시하는데 사용되는 ruby, rt, rp 노드는 무시한다.
//        - 후리가나는 주음부호, 한어병음, 한국 한자음이라고도 불린다.
//        - 단, 후리가나의 대상을 나타내는 rb는 무시하면 안 된다.
//             예) <ruby><rb>雪婆</rb><rt>ゆきば</rt></ruby>
//    6. 링크를 가진 sub, sup 노드는 무시한다. 링크가 없으면 Chunk로 만든다.
//        - sub, sup 안에 링크가 있을 수도 링크가 sub, sup를 포함하고 있을 수도 있다.
//             예) <sup><a id="comment_1">(1)</a></sup>
//    7. 한 문장 이상의 문장을 포함한 노드는 Chunk로 만든다.
//        - 단, 다수의 문장일 때는 문장 하나당 Chunk 하나로 만든다.
//        - 마지막 글자가 .|。|?|!|"|”|'|’|」|』 중 하나일 때 문장이라고 본다.
//    8. 다수의 문장을 나눌 때 사용되는 기준은 .|。|?|! 이렇게 네 개이다.
//        - 단, 기준이 발견된 문자의 다음 문자가 .|。|,|"|”|'|’|」|\]|\)|\r|\n 중 하나일 때는 문장으로 생각하지 않는다. (이는 대화체나 마침표가 반복적으로 사용된 문장을 잘라먹을 우려가 있기 때문이다)
//             예) <p>그가 '알았다고.' 말했잖아요?</p>
//    9. 한 문장이 되지 못하는 노드는 다음 노드와 합친다.
//        - 문장에서 특정 단어에 태그를 입혔을 때 그 단어 하나만 문장으로 구성될 우려가 있기 때문이다.
//             예) <p>제가 <b>하쿠나 마타타</b>라고 말하면 가는 겁니다.</p>
//        - 다음 노드에 대해서도 1~6번을 따른다.
//             - 단, 2번은 previousSibling이 span일 경우 무시한다.
//        - 다음 노드도 문장이 되지 못 한다면 다음 노드와 합친다.
//        - 마지막 노드를 만날 때까지 문장이 되지 못 한다면 Chunk로 만든다.
//
//
//    * 디오텍이 권장하는 텍스트 규칙.
//
//    1. 띄어쓰기, 철자, 구두점 등은 반드시 맞춤법에 맞아야 한다.
//    2. 마침표(.) 는 가능한 문장 마지막에만 사용한다.
//        - 마침표가 들어간 단어는 마침표를 없애거나 다른 기호로 바꿔 사용한다.
//             예) 출.도착 → 출도착
//    3. 띄어쓰기를 적절하게 사용한다.
//        - 기본적으로 한 어절 내에서는 쉬지 않고 그대로 연결해서 발음한다. 따라서, 어절이 길어질수록 명확성이 떨어진다.
//             예) “항공권분실”과 “항공권 분실”을 비교해 보자. 후자가 전자보다 “항공권”과 ”분실”을 좀더 명확하게 발음한다.
//        - 복합명사는 가급적 띄어쓰기를 하면 좋다.
//             예) 국내선스케줄 → 국내선 스케줄
//    4. 날짜 (년,월,일)
//        - 숫자와 한글(년,월,일)은 공백없이 붙여서 쓰고, 각 단위 사이는 띄어 쓴다.
//             예) 2002년 2월 22일 (이천이년 이월 이십이일)
//        - 슬래쉬(/)를 사용한 날짜 표기는 년, 월, 일 순으로 숫자와 슬래쉬(/) 사이에 공백 없이 입력한다.
//             예) 2002/2/22 (이천이년 이월 이십이일)
//    5. 시각 (시,분,초)
//        - 숫자와 한글(시,분,초)은 공백 없이 붙여서 쓰고, 각 단위 사이는 띄어 쓴다.
//             예) 12시30분30초 (열두시삼십분삼십초)
//        - 콜론(:)를 사용한 날짜 표기는 시, 분, 초 순으로 숫자와 콜론(:) 사이에 공백 없이 입력한다.
//             예) 12:30:30 (열두시 삼십분 삼십초)
//    6. 전화번호
//        - 대시(-)를 사용한 전화번호 표기는 숫자와 대시(-) 사이에 공백 없이 입력한다.
//             예) 02-2297-1450 (공이 이이구칠에 일사오공)
//    7. URL, E-mail 주소
//        - 시작은 반드시 영문 알파벳으로 시작하여야 한다.
//        - 사전에 등록되어 있는 단어는 사전의 발음대로 읽는다
//             예) http://www.hcilab.co.kr (에이취티티피 떠블류 떠블류 떠블류쩜 에이치씨아이랩쩜 씨오쩜 케이알)
//    8. 숫자와 단위
//        - 숫자와 단위는 붙여 쓴다.
//             예) 50,500원 (오만 오백 원), 13자리 (열세 자리)
//    9. 기타
//        - 기호는 특별한 경우를 제외하고 무시된다. 따라서 복합 명사처럼 만들기 위해서는 공백(‘ ‘)으로 대치하는 것이 좋다.
//             예) 서울/제주 → “서울 제주”
//
//
//    * 이것들은 어짜쓰까...
//
//    - 숫자에 제곱의 의미로 윗첨자가 붙었을 때. (숫자만 읽어버린다. 하하)
//    - span과 스타일을 이용해 윗첨자 또는 아랫첨자를 흉내냈을 때. (아오... 왜그러니.. 어소링 툴에 있을텐데 분명 =_=)
//    - 게임 판타지 소설에서 자주 나오는 캐릭터 또는 장비 스테이터스. (이걸 다 읽어줘야 하나...)
//    - 문장으로 생각했는데 뒤에 붙어야할 애가 있다.
//         예) <h2>내 '안'<span>에서</span><br>천직<spa...
//

var tts = {
  debug: false,

  chunks: [],
  chunkLengthLimit: 0,

  shouldNextPage: function(/*Number*/chunkId, /*Number*/canvasWidth, /*Boolean*/isPreceding) {

  },

  didPlaySpeech: function(/*Number*/chunkId) {

  },

  didFinishSpeech: function(/*Number*/chunkId) {

  },

  didFinishMakeChunks: function(/*Number*/index) {

  },

  makeChunksByRange: function(serializedRange) {
    var range = rangy.deserializeRange(serializedRange, document.body);
    var nodeIndex = -1, wordIndex = 0;
    var nodes = epub.textAndImageNodes;
    if (nodes === null) {
      return tts.chunks.length;
    }

    if (range !== null) {
      for (var i = 0, offset = 0; i < epub.textAndImageNodes.length; i++, offset = 0) {
        if (epub.textAndImageNodes[i] === range.startContainer) {
          nodeIndex = i;
          var words = range.startContainer.textContent.split(regexSplitWhitespace());
          for (; wordIndex < words.length; wordIndex++) {
            if (range.startOffset <= offset + words[wordIndex].length) {
              break;
            } else
              offset += (words[wordIndex].length + 1);
          }
          break;
        }
      }

      return tts.makeChunksByNodeLocation(nodeIndex, wordIndex);
    }

    return tts.chunks.length;
  },

  makeChunksByNodeLocation: function(/*Number*/nodeIndex, /*Number*/wordIndex) {
    var nodes = epub.textAndImageNode;
    if (nodes === null) {
      return tts.chunks.length;
    }

    nodeIndex = Math.max(nodeIndex, 0);
    wordIndex = Math.max(wordIndex, 0);

    var index = Math.max(tts.chunks.length - 1, 0);
    tts.chunkLengthLimit = Math.min(nodeIndex + 50, nodes.length);

    for (; nodeIndex < tts.chunkLengthLimit; nodeIndex++, wordIndex = 0) {
      var piece = new TTSPiece(nodeIndex, wordIndex);
      if (piece.node === null) {
        break;
      }

      var pieces = [piece];
      if (!piece.isValid() || piece.isOnlyWhitespace()) {
        tts.chunkLengthLimit = Math.min(tts.chunkLengthLimit + 1, nodes.length);
        continue;
      } else {
        if (nodeIndex == tts.chunkLengthLimit - 1 || piece.isImage() || 
            (piece.length > 1 && piece.isSentence()) || piece.isNextSiblingToBr()) {
          tts.addChunk(pieces);
        } else {
          var nextPiece = null;
          while ((nextPiece = new TTSPiece(++nodeIndex)).nodeIndex !== null) {
            if (!nextPiece.isValid()) {
              tts.chunkLengthLimit = Math.min(tts.chunkLengthLimit + 1, nodes.length);
            } else if (nextPiece.isImage() || nextPiece.isOnlyWhitespace()) {
              tts.addChunk(pieces);
              nodeIndex--;
              break;
            } else if (nextPiece.isNextSiblingToBr()) {
              pieces.push(nextPiece);
              tts.addChunk(pieces);
              break;
            } else {
              pieces.push(nextPiece);
              if (nextPiece.length > 1 && nextPiece.isSentence()) {
                tts.addChunk(pieces);
                break;
              }
            }
            if (nodeIndex == nodes.length - 1) {
              tts.addChunk(pieces);
            }
          }// end while
        }
        if (tts.chunkLengthLimit < nodeIndex) {
          tts.chunkLengthLimit = nodeIndex;
        }
      }
    }// end for

    tts.didFinishMakeChunks(index);

    return tts.chunks.length;
  },

  addChunk: function(/*Array<TTSPiece>*/pieces) {
    var RIDI = 'RidiDelimiter';

    // 문자열을 문장 단위(기준: .|。|?|!)로 나눈다.
    var split = function(text) {
      text = text.replace(/([.。?!])/gm, '$1[' + RIDI + ']');
      return text.split('[' + RIDI + ']');
    };

    var getOpenBracket = function(text) {
      var result = text.match(/[\(\{\[]/gm), ch = null;
      if (result !== null) {
          ch = result[0];
      }
      return ch;
    };

    var getCloseBracket = function(text) {
      var result = text.match(/[\)\}\]]/gm), ch = null;
      if (result !== null) {
          ch = result[result.length - 1];
      }
      return ch;
    };

    var isOnePair = function(openBracket, closeBracket) {
      if ((openBracket == '(' && closeBracket == ')') ||
          (openBracket == '{' && closeBracket == '}') ||
          (openBracket == '[' && closeBracket == ']')) {
        return true;
      } else
        return false;
    };

    // 문자가 숫자 또는 라틴(알파벳 포함) 문자일 경우 true.
    var isDigitOrLation = function(ch) {
      if (ch === null || ch === undefined)
        return false;
      else {
        var code = ch.charCodeAt(0);
        return isLatinCharCode(code) || isDigitCharCode(code);
      }
    };

    // '.'이 소수점 또는 영문이름을 위해 사용될 경우 true.
    var isPointOrName = function(text, nextText) {
      return (text.match(/[.]$/gm) !== null && isDigitOrLation(text[Math.max(text.length - 2, 0)]) && 
             nextText !== undefined && isDigitOrLation(nextText[0])) || 
             ((text + nextText).match(/[.]([\s]{0,}[A-Za-z])/gm) !== null);
    };

    // 문장의 마지막이 아닐 경우 true.
    var isNotEndOfSentence = function(nextText) {
      return nextText !== undefined && nextText.match(regexSentence('^')) !== null;
    };

    // Test Code
    var debug = function(caseNum) {
      if (tts.debug) {
        console.log('chunkId: ' + (tts.chunks.length - 1)
                   + ', Case: ' + caseNum
                   + ', Text: ' + tts.chunks[tts.chunks.length - 1].getText());
      }
    };

    var chunk = new TTSChunk(pieces);
    var tokens = split(chunk.getText());
    if (tokens.length > 1) {
      var offset = 0, startOffset = 0;
      var subText = '';
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        var openBracket, closeBracket, otherBracket;
        subText += token;
        offset += token.length;
        if ((openBracket = getOpenBracket(token)) !== null) {
          var isLast = false;
          for (var j = i; j < tokens.length; j++) {
            var nextToken = tokens[j];
            if (i < j) {
              subText += nextToken;
              offset += nextToken.length;
            }
            // TDD - 괄호가 섞였을 때는 어쩔건가. 예) [{~~~]}
            if ((closeBracket = getCloseBracket(nextToken)) !== null && isOnePair(openBracket, closeBracket)) {
              if (i == j && nextToken.lastIndexOf(closeBracket) < nextToken.lastIndexOf(openBracket)) {
                continue;
              } else if (i < j && (otherBracket = getOpenBracket(nextToken)) !== null) {
                openBracket = otherBracket;
                if ((otherBracket = getCloseBracket(nextToken)) !== null && isOnePair(openBracket, otherBracket)) {
                  isLast = true;
                }
                continue;
              } else
                isLast = true;
            }
            if (isPointOrName(subText, tokens[j + 1]) || isNotEndOfSentence(tokens[j + 1])) {
              isLast = true;
              continue;
            }
            if (isLast) {
              tts.chunks.push(chunk.copy(new TTSRange(startOffset, startOffset + subText.length)));
              subText = "";
              startOffset = offset;
              i = j;
              debug(1);
              break;
            }
          }// end for
        } else {
          if (isPointOrName(subText, tokens[i + 1]) || isNotEndOfSentence(tokens[i + 1])) {
            continue;
          }
          if (subText.length > 0) {
            tts.chunks.push(chunk.copy(new TTSRange(startOffset, startOffset + subText.length)));
          }
          subText = '';
          startOffset = offset;
          debug(2);
        }
      }// end for
      if (subText.length) {
        tts.chunks.push(chunk.copy(new TTSRange(startOffset, startOffset + subText.length)));
        debug(3);
      }
    } else {
      tts.chunks.push(chunk);
      debug(4);
    }
  },

  flush: function() {

  }
};
