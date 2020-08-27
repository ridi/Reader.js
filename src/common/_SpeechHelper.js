import Logger from './Logger';
import SpeechPiece from './SpeechPiece';
import SpeechChunk from './SpeechChunk';
import SpeechRange from './SpeechRange';
import SpeechUtil from './SpeechUtil';

//
// * TTS 노트.
//
//    * 문단/문장 나누기 규칙.
//
//    1. 텍스트가 없는 노드는 무시한다.
//    2. 읽을 수 없는 문자만 가지고 있는 노드는 무시한다.
//        - space(\s), newline(\n), tab(\t), retrun carriage(\r) 등 공백문자는 읽을 수 없다.
//        - 공백문자 중 개행문자는 디오텍에서 잡음으로 바꿀때가 있어 반드시 무시해아한다.
//    3. 형제 노드 중에 br 노드가 있을 때는 Chunk로 만든다.
//        - 마침표 또는 문장의 끝을 의미하는 문자 없이 newline 또는 br 태그가 쓰일 경우는 제목, 주제 등
//          의미를 부여하는 의도적인 줄 바꿈이기에 하나의 문장으로 봐야한다.
//             예) <h2>'성공하고 싶다'를<br>'행복해지고 싶다'로<br>바꾸자</h2>
//    4. [Deprecated] 이미지 노드는 alt 속성에 한 자 이상의 문자가 있을 때만 Chunk로 만든다.
//        - 단, 접미에 이미지 파일 확장자가 있다면 무시한다. (이미지 파일명을 넣은 출판사가 종종 있다)
//        - alt가 있는데 0자일 때가 있다.
//             예) <img id="cover" src="front_cover.jpg" alt="">
//    5. 후리가나를 표시하는데 사용되는 ruby, rt, rp 노드는 무시한다.
//        - 후리가나는 독음, 주음부호, 한어병음, 한국 한자음이라고도 불린다.
//        - 단, 후리가나의 대상을 나타내는 rb는 무시하면 안 된다.
//             예) <ruby><rb>雪婆</rb><rt>ゆきば</rt></ruby>
//    6. 윗/아래 첨자를 나타내는 sub, sup 노드는 무시한다.
//        - 첨자는 주석 또는 참고의 의미라 본문과 같이 읽게되면 문장 이해에 방해가 된다.
//        - sub, sup 안에 링크가 있을 수도 링크가 sub, sup를 포함하고 있을 수도 있다.
//             예) <sup><a id="comment_1">(1)</a></sup>
//    7. 한 문장 이상의 문장을 포함한 노드는 Chunk로 만든다.
//        - 단, 다수의 문장일 때는 문장 하나당 Chunk 하나로 만든다.
//        - 마지막 글자가 .|。|?|!|"|”|'|’|」|』 중 하나일 때 문장이라고 본다.
//    8. 다수의 문장을 나눌 때 사용되는 기준은 .|。|?|! 이렇게 네 개이다.
//        - 단, 기준이 발견된 문자의 다음 문자가 .|。|,|"|”|'|’|」|\]|\)|\r|\n 중 하나일 때는 문장으로 생각하지 않는다.
//          (이는 대화체나 마침표가 반복적으로 사용된 문장을 잘라먹을 우려가 있기 때문이다)
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

/**
 * @class _SpeechHelper
 * @private @property {Reader} _reader
 * @private @property {Content} _content
 * @private @property {Context} _context
 * @private @property {number} _reserveNodesCountMagic
 * @private @property {number} _makeChunksInterval
 * @private @property {number} _lastMinNodeIndex
 * @private @property {number} _lastMaxNodeIndex
 * @private @property {number} _generateMoreChunksTimeoutId
 * @private @property {boolean} _didFinishMakeChunksEnabled
 * @private @property {SpeechChunk[]} _chunks
 */
export default class _SpeechHelper {
  /**
   * @returns {Node[]}
   */
  get nodes() { return this._content.nodes; }

  /**
   * @returns {SpeechChunk[]}
   */
  get chunks() { return this._chunks; }

  /**
   * @returns {Context}
   */
  get _context() { return this._reader.context; }

  /**
   * @param {Content} content
   */
  constructor(content) {
    this._reader = content._reader;
    this._content = content;
    this._reserveNodesCountMagic = 40; // 30 미만의 값으로 줄일 경우 끊김 현상이 발생할 수 있다.
    this._makeChunksInterval = 100;
    this._lastMinNodeIndex = -1;
    this._lastMaxNodeIndex = -1;
    this._generateMoreChunksTimeoutId = 0;
    this._didFinishMakeChunksEnabled = false;
    this._chunks = [];
  }

  /**
   * @typedef {object} NodeLocation
   * @property {number} nodeIndex
   * @property {number} wordIndex
   */
  /**
   * @param {string} serializedRange
   * @returns {NodeLocation}
   * @private
   */
  _serializedRangeToNodeLocation(serializedRange) {
    const range = Range.fromSerializedRange(serializedRange, this._content.ref);
    if (range === null) {
      throw new Error('SpeechHelper: range is invalid.');
    }

    const { nodes } = this;
    let nodeIndex = -1;
    let wordIndex = 0;
    if (nodes) {
      for (let i = 0, offset = 0; i < nodes.length; i += 1, offset = 0) {
        if (nodes[i] === range.startContainer) {
          nodeIndex = i;
          const words = range.startContainer.textContent.split(SpeechUtil.getSplitWordRegex());
          for (; wordIndex < words.length; wordIndex += 1) {
            if (range.startOffset <= offset + words[wordIndex].length) {
              break;
            } else {
              offset += (words[wordIndex].length + 1);
            }
          }
          break;
        }
      }
    }

    return { nodeIndex, wordIndex };
  }

  /**
   * @param {string} serializedRange
   */
  playChunksBySerializedRange(serializedRange) {
    const nodeLocation = this._serializedRangeToNodeLocation(serializedRange);
    this.playChunksByNodeLocation(nodeLocation.nodeIndex, nodeLocation.wordIndex);
  }

  /**
   * @param {number} nodeIndex
   * @param {number} wordIndex
   */
  playChunksByNodeLocation(nodeIndex, wordIndex) {
    this.makeChunksByNodeLocation(nodeIndex, wordIndex, true);
    if (this.chunks.length === 0) {
      this.makeChunksByNodeLocationReverse(nodeIndex, wordIndex, true);
    }
    if (this.chunks.length > 0) {
      /**
       * NOTE : reserveNodesCount = 0으로 만들어 주어도 현재 시작 지점이
       * chpater 제목이거나 (끊어 읽기는 하지만 문장이 아니므로 생성이 계속 진행됨)
       * 한 node에 여러 문장이 들어있는 상태라면
       * 임시 Chunk가 여러 개 생성되므로 첫 문장만 남기고 제거한다.
       */
      this._chunks = [this.chunks[0]];
      this.didFinishMakePartialChunks(true, false);
    } else {
      this.didFinishMakeChunks();
    }
  }

  makeLastSentenceChunks() {
    this.makeChunksByNodeLocationReverse(-1, -1, true);
    const emptyChunkRegex = SpeechUtil.getWhitespaceAndNewLineRegex('^', '$', null);
    let lastSentenceChunk = null;
    for (let i = this.chunks.length - 1; i >= 0; i -= 1) {
      lastSentenceChunk = this.chunks[i];
      if (lastSentenceChunk.utterance.text.match(emptyChunkRegex)) {
        lastSentenceChunk = null;
      } else {
        break;
      }
    }

    if (lastSentenceChunk) {
      this._chunks = [];
      this.makeAdjacentChunksByNodeLocation(
        lastSentenceChunk.getStartNodeIndex(), lastSentenceChunk.getStartWordIndex());
    } else {
      this._didFinishMakeChunksEnabled = true;
      this.didFinishMakeChunks();
    }
  }

  /**
   * @param {string} serializedRange
   */
  makeAdjacentChunksBySerializedRange(serializedRange) {
    const nodeLocation = this._serializedRangeToNodeLocation(serializedRange);
    this.makeAdjacentChunksByNodeLocation(nodeLocation.nodeIndex, nodeLocation.wordIndex);
  }

  /**
   * @param {number} nodeIndex
   * @param {number} wordIndex
   */
  makeAdjacentChunksByNodeLocation(nodeIndex = -1, wordIndex = -1) {
    /**
     * Android에서 spine 넘어갈 때 didFinishMakeChunks 중복 호출을 통제하기 위해
     * flush 후 처음으로 chunk를 생성하기 전까지는 호출을 막아둔다.
     */
    this._didFinishMakeChunksEnabled = true;
    this.makeChunksByNodeLocation(nodeIndex, wordIndex);
    // 첫 번째 chunk는 불완전한 문장일 수 있어 제거. (문장의 시작이 어딘지 모르므로.)
    this.chunks.shift();
    const firstChunk = this.chunks[0];
    let endNodeIndex = -1;
    let endWordIndex = -1;
    if (firstChunk) {
      endNodeIndex = firstChunk.getStartNodeIndex();
      endWordIndex = firstChunk.getStartWordIndex() - 1;
      if (endWordIndex < 0) {
        endNodeIndex -= 1;
      }
    }
    this.makeChunksByNodeLocationReverse(endNodeIndex, endWordIndex);
    this.didFinishMakePartialChunks(false, false);

    this.playChunksByNodeLocation(nodeIndex, wordIndex);

    const hasMoreAfterChunks = () => (this.processedNodeMaxIndex + 1 < this.nodes.length);
    const hasMoreBeforeChunks = () => (this.processedNodeMinIndex - 1 >= 0);
    let generateMoreChunks = () => {};
    const scheduleTask = () => {
      if (hasMoreAfterChunks() || hasMoreBeforeChunks()) {
        const timeoutId = this._generateMoreChunksTimeoutId;
        if (this._makeChunksInterval > 0) {
          setTimeout(() => generateMoreChunks(timeoutId), this._makeChunksInterval);
        } else {
          // Only for test
          generateMoreChunks(timeoutId);
        }
      } else {
        this.didFinishMakeChunks();
      }
    };
    generateMoreChunks = (timeoutId) => {
      if (timeoutId !== this._generateMoreChunksTimeoutId) {
        return;
      }

      if (hasMoreAfterChunks()) {
        this.makeChunksByNodeLocation(this.processedNodeMaxIndex + 1);
        this.didFinishMakePartialChunks(false, false);
      }

      if (hasMoreBeforeChunks()) {
        this.makeChunksByNodeLocationReverse(this.processedNodeMinIndex - 1);
        this.didFinishMakePartialChunks(false, true);
      }

      scheduleTask();
    };

    scheduleTask();
  }

  /**
   * @param {number} nodeIndex
   * @param {number} wordIndex
   * @param {boolean} isMakingTemporalChunk Selection 듣기 등 온전하지 못한 문장을 위한 임시 Chunk 1개를 만드는 경우이다.
   * @returns {number}
   */
  makeChunksByNodeLocation(nodeIndex = -1, wordIndex = -1, isMakingTemporalChunk = false) {
    const { nodes } = this;

    nodeIndex = Math.max(nodeIndex, 0);
    wordIndex = Math.max(wordIndex, 0);

    const reserveNodesCount = (isMakingTemporalChunk ? 0 : this._reserveNodesCountMagic);
    let maxNodeIndex = Math.min(nodeIndex + reserveNodesCount, nodes.length - 1);

    const incrementMaxIndex = () => { maxNodeIndex = Math.min(maxNodeIndex + 1, nodes.length - 1); };
    let pieceBuffer = [];
    const flushPieces = () => {
      this._addChunk(pieceBuffer, false);
      pieceBuffer = [];
    };

    for (; nodeIndex <= maxNodeIndex + 1; nodeIndex += 1, wordIndex = -1) {
      if (nodeIndex >= nodes.length) {
        flushPieces();
        break;
      }

      let piece;
      try {
        const node = nodes[nodeIndex];
        piece = new SpeechPiece(node, nodeIndex, wordIndex);
      } catch (e) {
        Logger.error(e);
        break;
      }

      // maxIndex + 1까지 살펴보는 것은 이전까지 만들어둔 piece들이 완성된 문장인지 판단하기 위함이다.
      const aboveMaxIndex = (nodeIndex > maxNodeIndex);

      if (piece.isInvalid()) {
        // invalid (아랫 첨자 등) 의 경우 문장의 끝이 아닐 수 있다.
        if (!aboveMaxIndex) {
          incrementMaxIndex();
        }
      } else if (piece.isOnlyWhitespace()) {
        flushPieces();
        if (!aboveMaxIndex) {
          incrementMaxIndex();
        }
      } else if (!aboveMaxIndex && piece.isSiblingBrRecursive(true)) {
        pieceBuffer.push(piece);
        // 다음 element가 br이라면 현재 piece의 끝 부분은 문장이 끝나는 부분이라고 판단할 수 있다.
        // 문장이 완성되었으므로 flush.
        flushPieces();
      } else {
        if (!aboveMaxIndex) {
          pieceBuffer.push(piece);
        }

        if (!aboveMaxIndex && piece.length > 1 && piece.isSentence()) {
          // 현재 piece의 말단 부분이 문장의 끝 부분을 포함하고 있으므로
          // 이제까지 쌓인 piece들이 완성된 문장이 되었다는 판단을 할 수 있다.
          flushPieces();
        } else if (nodeIndex >= maxNodeIndex) {
          // 문장의 나머지 부분이 더 존재하는 경우이므로 계속 진행한다.
          incrementMaxIndex();

          if (aboveMaxIndex) {
            // 위에서 현재 노드를 계속 무시했는데, maxIndex가 증가되었으므로
            // 현재 node부터 다시 처리해야한다.
            nodeIndex -= 1;
          }
        }
      }
    }
    if (!isMakingTemporalChunk) {
      this._lastMaxNodeIndex = maxNodeIndex;
    }
    return this.chunks.length;
  }

  /**
   * @param {number} nodeIndex
   * @param {number} wordIndex
   * @param {boolean} isMakingTemporalChunk
   * @returns {boolean}
   */
  makeChunksByNodeLocationReverse(nodeIndex = -1, wordIndex = -1, isMakingTemporalChunk = false) {
    const { nodes } = this;

    const wordsInNode = node => (node ? (node.nodeValue || '').split(SpeechUtil.getSplitWordRegex()) : []);

    const reserveNodesCount = (isMakingTemporalChunk ? 0 : this._reserveNodesCountMagic);
    const maxNodeIndex = nodes.length - 1;
    let minNodeIndex = Math.max(0, nodeIndex - reserveNodesCount);
    nodeIndex = (nodeIndex >= 0 ? Math.min(nodeIndex, maxNodeIndex) : maxNodeIndex);

    const maxWordIndex = wordsInNode(nodes[nodeIndex]).length - 1;
    let startWordIndex = 0;
    let endWordIndex = (wordIndex >= 0 ? Math.min(wordIndex, maxWordIndex) : maxWordIndex);

    const decrementMinIndex = () => { minNodeIndex = Math.max(minNodeIndex - 1, 0); };
    let pieceBuffer = [];
    const flushPieces = () => {
      this._addChunk(pieceBuffer, true);
      pieceBuffer = [];
    };

    const initMinIndex = minNodeIndex;
    for (; nodeIndex >= minNodeIndex - 1; nodeIndex -= 1, startWordIndex = -1, endWordIndex = -1) {
      if (nodeIndex < 0) {
        flushPieces();
        break;
      }

      let piece;
      try {
        const node = nodes[nodeIndex];
        piece = new SpeechPiece(node, nodeIndex, startWordIndex, endWordIndex);
      } catch (e) {
        Logger.error(e);
        break;
      }

      // minIndex - 1까지 살펴보는 것은 이전까지 만들어둔 piece들이 완성된 문장인지 판단하기 위험이다.
      const belowMinNodeIndex = (nodeIndex < minNodeIndex);

      if (piece.isInvalid()) {
        // invalid (아랫 첨자 등) 의 경우 문장을 분리하는 기준이 될 수 없다.
        if (!belowMinNodeIndex) {
          decrementMinIndex();
        }
      } else if (piece.isOnlyWhitespace()) {
        flushPieces();
        if (!belowMinNodeIndex) {
          decrementMinIndex();
        }
      } else if (!belowMinNodeIndex && piece.isSiblingBrRecursive(false)) {
        pieceBuffer.unshift(piece);
        // 이전 element가 br이라면 이 piece의 시작 부분은 현재 문장의 처음 부분을 담고 있다.
        // 문장이 완성되었으므로 flush.
        flushPieces();
      } else {
        const isCurrentPieceSentence = (piece.length > 1 && piece.isSentence());

        if (isCurrentPieceSentence) {
          // 현재 piece의 말단 부분이 새로운 문장의 끝 부분을 포함하고 있으므로
          // 이전까지 쌓아두었던 piece들 앞에 더 이상 다른 내용이 붙지 않을 것임을 알 수 있다.
          // 즉, 쌓여있는 piece들이 완성된 문장이 되었다는 판단을 할 수 있다.
          flushPieces();

          // 충분한 수의 chunk가 만들어진 경우 멈춘다.
          if (nodeIndex < initMinIndex && this.chunks.length > 0) {
            minNodeIndex = nodeIndex + 1;
            break;
          }
        }

        if (belowMinNodeIndex) {
          // 현재 piece가 문장이라면 minIndex까지의 piece들 만으로 문장이 완성되므로 더 할 일이 없다.
          if (!isCurrentPieceSentence) {
            // 아직 이전 문장의 끝 부분을 발견하지 못했으므로 계속 진행한다.
            decrementMinIndex();
            // 위에서 현재 node를 계속 무시했는데, minIndex가 감소되었으므로
            // 현재 node부터 다시 처리해야한다.
            nodeIndex += 1;
          }
        } else {
          pieceBuffer.unshift(piece);

          if (nodeIndex === minNodeIndex) {
            // 아직 이전 문장의 끝 부분을 발견하지 못했으므로 계속 진행한다.
            decrementMinIndex();
          }
        }
      }
    }
    if (!isMakingTemporalChunk) {
      this._lastMinNodeIndex = minNodeIndex;
    }
    return this.chunks.length;
  }

  /**
   * makeChunksByNodeLocation(Reverse)를 1회 실행한 후 불리는 메소드
   *
   * @param {boolean} isMakingTemporalChunk
   * @param {boolean} addAtFirst
   */
  didFinishMakePartialChunks(/* isMakingTemporalChunk, addAtFirst */) {
    throw new Error('SpeechHelper: Must override this method');
  }

  /**
   * 모든 chunk를 이미 다 만들었을 때, 즉 새로운 chunk를 만들지 못했을 때 불리는 메소드
   *
   * @returns {boolean}
   */
  didFinishMakeChunks() {
    if (this._didFinishMakeChunksEnabled) {
      this._didFinishMakeChunksEnabled = false;
      return true;
    }
    return false;
  }

  /**
   * @param {SpeechPiece[]} pieces
   * @param {boolean} addAtFirst
   * @private
   */
  _addChunk(pieces, addAtFirst) {
    if (pieces.length === 0) {
      return;
    }

    // 문자열을 문장 단위(기준: .|。|?|!)로 나눈다
    // '"ABCDEF. "'와 같은 경우 문장 끝의 trailing space를 제거한다.
    const RIDI = 'RidiDelimiter';
    const split = text => text.replace(/([.。?!])/gm, `$1[${RIDI}]`).split(`[${RIDI}]`)
      .filter(splitText => splitText.trim().length > 0);

    // 문장의 마지막이 아닐 경우 true
    const isNotEndOfSentence =
      nextText => nextText !== undefined && nextText.match(SpeechUtil.getSentenceRegex('^')) !== null;

    // Debug Info
    const log = (caseNum, chunk) => {
      if (chunk) {
        Logger.debug(`Case: ${caseNum}, Text: ${chunk.text}`);
      }
    };

    const makeTrimmedRange = (startOffset, text) => {
      const paddingLeft = (text.match(/^([\s]+)/g) || [''])[0].length;
      const paddingRight = (text.match(/([\s]+)$/g) || [''])[0].length;
      return new SpeechRange(startOffset + paddingLeft, (startOffset + text.length) - paddingRight);
    };

    const buffer = [];
    const pushToChunks = (chunk) => {
      if (addAtFirst) {
        buffer.push(chunk);
      } else {
        this.chunks.push(chunk);
      }
      return chunk;
    };

    const chunk = new SpeechChunk(pieces);
    const tokens = SpeechUtil.mergeSentencesWithinBrackets(split(chunk.text));
    if (tokens.length > 1) {
      let offset = 0;
      let startOffset = 0;
      let subText = '';
      for (let i = 0; i < tokens.length; i += 1) {
        const token = tokens[i];
        subText += token;
        offset += token.length;
        if (SpeechUtil.isPeriodPointOrName(subText, tokens[i + 1]) || isNotEndOfSentence(tokens[i + 1])) {
          // 소수점, 영문 이름을 위한 '.'을 만나거나 문장의 끝을 의미하는 문자가 없을 때는 아직 문장이 끝나지 않았다
          continue;
        }
        if (subText.length) {
          log(1, pushToChunks(chunk.copy(makeTrimmedRange(startOffset, subText))));
          subText = '';
        }
        startOffset = offset;
      }
      if (subText.length) {
        // 루프가 끝나도록 추가되지 못한 애들을 추가한다
        log(2, pushToChunks(chunk.copy(makeTrimmedRange(startOffset, subText))));
      }
    } else if (tokens.length === 1) {
      // 문장(token)이 하나 뿐이라 바로 추가한다
      log(3, pushToChunks(chunk.copy(makeTrimmedRange(0, tokens[0]))));
    }

    if (addAtFirst) {
      while (buffer.length > 0) {
        this.chunks.unshift(buffer.pop());
      }
    }
  }

  /**
   * @typedef {object} ChunkInfo
   * @property {number} nodeIndex
   * @property {number} wordIndex
   * @property {string} text
   * @property {string} rectListString
   */
  /**
   * @param {SpeechChunk} chunk
   * @returns {ChunkInfo}
   */
  getChunkInfo(chunk) {
    return {
      nodeIndex: chunk.getStartNodeIndex(),
      wordIndex: chunk.getStartWordIndex(),
      text: chunk.utterance.text,
      rectListString: chunk.getRectList(true).trim().toAbsolute().toJsonString(),
    };
  }

  flush() {
    this._lastMinNodeIndex = -1;
    this._lastMaxNodeIndex = -1;
    this._generateMoreChunksTimeoutId += 1;
    this._didFinishMakeChunksEnabled = false;
    this._chunks = [];
  }
}
