import _Object from './_Object';
import _Util from './_Util';
import TTSUtil from './tts/TTSUtil';

export default class _Sel extends _Object {
  /**
   * @returns {Reader}
   */
  get reader() { return this._reader; }

  /**
   * @returns {Boolean}
   */
  get nextPageContinuable() { return this._checkNextPageContinuable(this.getSelectedRange()); }

  /**
   * @param {Reader} reader
   */
  constructor(reader) {
    super();
    this._reader = reader;
    this._maxLength = reader.context.maxSelectionLength;
    this._startContainer = null;
    this._startOffset = null;
    this._endContainer = null;
    this._endOffset = null;
    this._overflowed = false; // 셀렉션 글자수 제한을 넘긴 상태인지
    this._nextPageContinuable = false; // 다음 페이지로 이어서 셀렉션을 할 수 있는지(페이지 모드 전용)
    this._continueContainer = null;
    this._continueOffset = null;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {String} unit (character or word)
   * @param {Boolean} allowCollapsed
   * @returns {TextRange|null}
   * @private
   */
  _caretRangeFromPoint(x, y, unit = 'word', allowCollapsed = false) {
    const point = this.reader.adjustPoint(x, y);
    const range = document.caretRangeFromPoint(point.x, point.y);
    if (range === null) {
      return null;
    }

    range.expand(unit);
    if (!allowCollapsed && range.collapsed) {
      return null;
    }

    return range;
  }

  /**
   * @param {Range} range
   * @private
   */
  _expandRangeByWord(range) {
    const { startContainer } = range;
    if (startContainer.nodeValue === null) {
      return;
    }

    const tables = [TTSUtil.chineseCodeTable(), TTSUtil.japaneseCodeTable()];
    if (TTSUtil.getContainCharRegex(tables).test(range.toString())) {
      range.expand('character');
      return;
    }

    const containerValueLength = startContainer.nodeValue.length;
    let start = range.startOffset;
    let origin = start;

    while (start > 0) {
      if (/^\s/.test(range.toString())) {
        range.setStart(startContainer, start += 1);
        break;
      }
      start -= 1;
      range.setStart(startContainer, start);
    }

    while (origin < containerValueLength) {
      if (/\s$/.test(range.toString())) {
        range.setEnd(startContainer, origin -= 1);
        break;
      }
      origin += 1;
      range.setEnd(startContainer, origin);
    }
  }

  /**
   * @param {Range} range
   * @returns {Boolean}
   */
  isOutOfBounds(/* range */) {
    return false;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {String} unit (character or word)
   * @returns {Boolean}
   */
  startSelectionMode(x, y, unit) {
    const range = this._caretRangeFromPoint(x, y, unit);
    if (range === null) {
      return false;
    }

    // 처음 선택시에는 붙어있는 특수문자까지 모두 포함시킨다
    this._expandRangeByWord(range);

    if (!range.toString().length) {
      return false;
    }

    this._startContainer = range.startContainer;
    this._startOffset = range.startOffset;
    this._endContainer = range.endContainer;
    this._endOffset = range.endOffset;

    return true;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {String} unit (character or word)
   * @returns {Boolean}
   */
  changeInitialSelection(x, y, unit) {
    const range = this._caretRangeFromPoint(x, y, unit);
    if (range === null) {
      return false;
    }

    this._startContainer = range.startContainer;
    this._startOffset = range.startOffset;
    this._endContainer = range.endContainer;
    this._endOffset = range.endOffset;

    return true;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {String} unit (character or word)
   * @returns {Boolean}
   */
  expandUpperSelection(x, y, unit = 'character') {
    const exRange = this._caretRangeFromPoint(x, y, unit, true);
    if (exRange === null) {
      return false;
    }

    const containerDiff = this._endContainer.compareDocumentPosition(exRange.startContainer);
    if (containerDiff === Node.DOCUMENT_POSITION_FOLLOWING ||
      (containerDiff === 0 && this._endOffset < exRange.startOffset)) {
      return false;
    }

    if (exRange.startContainer === this._startContainer &&
      exRange.startOffset === this._startOffset) {
      return false;
    }

    // selection이 상위 div 등의 배경에 거친 경우 offset들은 childNode의 index이므로
    // 해당 childNode를 start/end container로 설정한다
    if (exRange.startContainer.childNodes.length) {
      exRange.setStart(exRange.startContainer.childNodes[exRange.startOffset], 0);
    }
    if (exRange.endContainer.childNodes.length) {
      exRange.setEnd(exRange.endContainer.childNodes[exRange.endOffset],
        exRange.endContainer.childNodes[exRange.endOffset].textContent.length);
    }

    const range = document.createRange();
    range.setStart(exRange.startContainer, exRange.startOffset);
    range.setEnd(this._endContainer, this._endOffset);
    if (range.collapsed) {
      return false;
    }

    if (!this.validLength(range)) {
      return false;
    }

    this._startContainer = exRange.startContainer;
    this._startOffset = exRange.startOffset;

    return true;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {String} unit (character or word)
   * @returns {Boolean}
   */
  expandLowerSelection(x, y, unit = 'character') {
    const exRange = this._caretRangeFromPoint(x, y, unit, true);
    if (exRange === null) {
      return false;
    }

    const containerDiff = this._startContainer.compareDocumentPosition(exRange.endContainer);
    if (containerDiff === Node.DOCUMENT_POSITION_PRECEDING ||
      (containerDiff === 0 && this._startOffset > exRange.endOffset)) {
      return false;
    }

    if (exRange.endContainer === this._endContainer && exRange.endOffset === this._endOffset) {
      return false;
    }

    // selection이 상위 div 등의 배경에 거친 경우 offset들은 childNode의 index이므로
    // 해당 childNode를 start/end container로 설정한다
    if (exRange.startContainer.childNodes.length) {
      exRange.setStart(exRange.startContainer.childNodes[exRange.startOffset], 0);
    }
    if (exRange.endContainer.childNodes.length) {
      exRange.setEnd(exRange.endContainer.childNodes[exRange.endOffset],
        exRange.endContainer.childNodes[exRange.endOffset].textContent.length);
    }

    if (this.isOutOfBounds(exRange)) {
      return false;
    }

    const range = document.createRange();
    range.setStart(this._startContainer, this._startOffset);
    range.setEnd(exRange.endContainer, exRange.endOffset);
    if (range.collapsed) {
      return false;
    }

    if (!this.validLength(range)) {
      return false;
    }

    this._endContainer = exRange.endContainer;
    this._endOffset = exRange.endOffset;

    return true;
  }

  /**
   * @param {Range} range
   * @returns {Number}
   * @private
   */
  _clientLeftOfRangeForCheckingNextPageContinuable(range) {
    const rect = range.getAdjustedBoundingClientRect();
    return Math.floor(rect.left + rect.width);
  }

  /**
   * @param {Range} range
   * @returns {Boolean}
   * @private
   */
  _checkNextPageContinuable(range) {
    if (!this.reader.context.isScrollMode) {
      const upperBound = this.getUpperBound();
      const clonedRange = range.cloneRange();
      let node = clonedRange.endContainer;
      let end = clonedRange.endOffset;
      do {
        const { length } = node.textContent;
        while (length > end) {
          clonedRange.setStart(node, end);
          clonedRange.setEnd(node, end + 1);
          if (/\s/.test(clonedRange.toString())) {
            end += 1;
          } else if (this._clientLeftOfRangeForCheckingNextPageContinuable(clonedRange) < upperBound) {
            this._nextPageContinuable = false;
            return this._nextPageContinuable;
          } else {
            this._expandRangeBySentenceInPage(clonedRange, upperBound * 2);
            this._continueContainer = clonedRange.endContainer;
            this._continueOffset = clonedRange.endOffset;
            this._nextPageContinuable = true;
            return this._nextPageContinuable;
          }
        }
        end = 0;
        this._nextPageContinuable = false;
      } while ((node = this._getNextTextNode(clonedRange)));
    }
    return this._nextPageContinuable;
  }

  /**
   * @param {Range} range
   * @param {Number} upperBound
   * @private
   */
  _expandRangeBySentenceInPage(range, upperBound) {
    const origin = range.endOffset;
    range.expand('sentence');
    _Sel._moveRangeEndIntoTextNode(range);

    let end = range.endOffset;
    while (end > origin) {
      if (/\s$/.test(range.toString())) {
        range.setEnd(range.endContainer, end -= 1);
      } else if (range.getAdjustedBoundingClientRect().right <= upperBound) {
        break;
      } else {
        range.setEnd(range.endContainer, end -= 1);
      }
    }
  }

  /**
   * range 끝이 요소(예: `<br/>`로 문단을 나눈 문서에서 expand('sentence') 결과인 (div, 자식 인덱스))이면
   * range 안의 마지막 텍스트 노드 끝으로 옮긴다. 끝 offset을 글자 단위로 줄여 나가는 로직이 요소의 자식 인덱스를
   * 글자 수로 다루지 않도록 하기 위함이다.
   *
   * @param {Range} range
   * @private
   */
  static _moveRangeEndIntoTextNode(range) {
    if (range.endContainer.nodeType === Node.TEXT_NODE) {
      return;
    }

    const iterator = _Util.createTextNodeIterator(range.commonAncestorContainer);
    let lastTextNode = null;
    let node;
    while ((node = iterator.nextNode())) {
      if (range.comparePoint(node, 0) > 0) {
        break;
      }
      // 공백뿐인 텍스트 노드(요소 사이 개행 등)에 끝을 두지 않는다.
      if (range.comparePoint(node, node.length) >= 0 && !/^\s*$/.test(node.nodeValue)) {
        lastTextNode = node;
      }
    }

    if (lastTextNode !== null) {
      range.setEnd(lastTextNode, lastTextNode.length);
    }
  }

  /**
   * @param {Range} range
   * @returns {Node|null}
   * @private
   */
  _getNextTextNode(range) {
    const node = range.endContainer;
    const nextNode = node.nextSibling;
    if (nextNode) {
      if (nextNode.nodeType === Node.TEXT_NODE) {
        // case 1-1:
        // p
        //   text (node)
        //   text (nextNode)
        return nextNode;
      }

      const textNode = _Util.createTextNodeIterator(nextNode).nextNode();
      if (textNode) {
        // case 2-1:
        // p
        //   text (node)
        //   b
        //      text (textNode)
        //   text
        return textNode;
      }

      // case 3
      // p
      //   t (node)
      // div
      //   img
      range.setEnd(nextNode, 0);
      return this._getNextTextNode(range);
    }

    range.setEndAfter(range.endContainer);
    if (range.endContainer.nodeName === 'BODY') {
      // case: 4
      // body
      //   p
      //   p
      //     text (node)
      return null;
    }

    // case 1-2:
    // p
    //   text (node)
    // text (nextNode)
    // caae 2-2:
    // p
    //   text (node)
    // p
    //   text (textNode)
    // case 2-3:
    // p
    //   text (node)
    // div
    //   p
    //     text (textNode)
    return this._getNextTextNode(range);
  }

  /**
   * @returns {Boolean}
   */
  expandSelectionIntoNextPage() {
    if (!this._nextPageContinuable) {
      return false;
    }

    this._endContainer = this._continueContainer;
    this._endOffset = this._continueOffset;
    this._nextPageContinuable = false;

    return true;
  }

  /**
   * @param {Range} range
   * @returns {Boolean}
   */
  validLength(range) {
    if (!(range.toString().length <= this._maxLength)) {
      if (!this._overflowed) {
        _Util.toast(`최대 ${this._maxLength}자까지 선택할 수 있습니다.`);
      }
      this._overflowed = true;
      return false;
    }
    return true;
  }

  /**
   * @returns {Range}
   */
  getSelectedRange() {
    const range = document.createRange();
    range.setStart(this._startContainer, this._startOffset);
    range.setEnd(this._endContainer, this._endOffset);
    return range;
  }

  /**
   * @param {Content} content
   * @returns {String}
   */
  getSelectedSerializedRange() {
    return rangy.serializeRange(this.getSelectedRange(), true, this.reader.content.body);
  }

  /**
   * @returns {MutableClientRect[]}
   */
  getSelectedRangeRects() {
    return _Sel.getOnlyTextNodeRectsFromRange(this.getSelectedRange());
  }

  /**
   * @returns {String}
   */
  getSelectedText() {
    return this.getSelectedRange().toString();
  }

  /**
   * @returns {String}
   */
  getSelectedRectsCoord() {
    const rects = this.getSelectedRangeRects();
    if (rects.length) {
      this._overflowed = false;
      return this.reader.rectsToAbsoluteCoord(rects);
    }
    return '';
  }

  /**
   * @param {Range} range
   * @returns {Boolean}
   * @private
   */
  static _isWhiteSpaceRange(range) {
    return /^\s*$/.test(range.toString());
  }

  /**
   * @param {Range} range
   * @returns {MutableClientRect[]}
   */
  static getOnlyTextNodeRectsFromRange(range) {
    if (range.startContainer === range.endContainer) {
      const { innerText } = range.startContainer;
      if (innerText !== undefined && innerText.length === 0) {
        return [];
      }
      return range.getAdjustedClientRects();
    }

    // start/endContainer가 텍스트 노드가 아니라 요소일 수도 있다.
    // 예: `<br/>`로 문단을 나눈 문서에서 range.expand('sentence')는 문장 끝을 (div, 자식 인덱스)로 돌려준다.
    // 요소 기준으로 비교하면 그 요소 안의 텍스트 노드가 통째로 들어가므로(형광펜 이어서 남기기 시 다음 페이지 전체 선택),
    // 텍스트 노드마다 range와 겹치는 부분만 잘라서 rect를 구한다.
    const iterator = _Util.createTextNodeIterator(range.commonAncestorContainer);
    let textNodeRects = [];

    let node;
    while ((node = iterator.nextNode())) {
      // range 끝보다 뒤에서 시작하면 멈춤
      if (range.comparePoint(node, 0) > 0) {
        break;
      }

      // range 시작보다 앞에서 끝나면 건너뜀
      if (range.comparePoint(node, node.length) < 0) {
        continue;
      }

      const workRange = document.createRange();
      workRange.selectNodeContents(node);
      if (node === range.startContainer) {
        workRange.setStart(node, range.startOffset);
      }
      if (node === range.endContainer) {
        workRange.setEnd(node, range.endOffset);
      }
      if (node !== range.startContainer && this._isWhiteSpaceRange(workRange)) {
        continue;
      }

      textNodeRects = _Util.concatArray(textNodeRects, workRange.getAdjustedClientRects());
    }

    return textNodeRects;
  }
}
