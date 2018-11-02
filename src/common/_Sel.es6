import _Object from './_Object';
import _Util from './_Util';
import TTSUtil from './tts/TTSUtil';

export default class _Sel extends _Object {
  /**
   * @returns {Reader}
   */
  get reader() { return this._reader; }

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
    this._isOverflowed = false; // 셀렉션 글자수 제한을 넘긴 상태인지
    this._continueContainer = null;
    this._continueOffset = null;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {Node} rootNode
   * @param {String} unit (character or word)
   * @returns {Boolean}
   */
  start(x, y, rootNode, unit) {
    const range = this._getCaretRange(x, y, rootNode, unit);
    if (range === null) {
      return false;
    }

    // 처음 선택시에는 붙어있는 특수문자까지 모두 포함시킨다
    this._expandRangeByWord(range);

    this._startContainer = range.startContainer;
    this._startOffset = range.startOffset;
    this._endContainer = range.endContainer;
    this._endOffset = range.endOffset;

    return true;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {Node} rootNode
   * @param {String} unit (character or word)
   * @returns {Boolean}
   */
  expandIntoUpper(x, y, rootNode, unit = 'character') {
    const exRange = this._getCaretRange(x, y, rootNode, unit, true);
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

    if (!this._isValid(range)) {
      return false;
    }

    this._startContainer = exRange.startContainer;
    this._startOffset = exRange.startOffset;

    return true;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {Node} rootNode
   * @param {String} unit (character or word)
   * @returns {Boolean}
   */
  expandIntoLower(x, y, rootNode, unit = 'character') {
    const exRange = this._getCaretRange(x, y, rootNode, unit, true);
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

    if (!this._isValid(range)) {
      return false;
    }

    this._endContainer = exRange.endContainer;
    this._endOffset = exRange.endOffset;

    return true;
  }

  /**
   * @returns {Boolean}
   */
  expandIntoNextPage() {
    if (!this.isExpandContinuableIntoNextPage()) {
      return false;
    }

    this._endContainer = this._continueContainer;
    this._endOffset = this._continueOffset;

    return true;
  }

  /**
   * @returns {Boolean}
   */
  isExpandContinuableIntoNextPage() {
    return this._isExpandContinuableIntoNextPage(this.getRange());
  }

  /**
   * @param {Range} range
   * @returns {Boolean}
   * @private
   */
  _isExpandContinuableIntoNextPage(range) {
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
            return false;
          } else {
            this._expandRangeBySentence(clonedRange, upperBound * 2);
            this._continueContainer = clonedRange.endContainer;
            this._continueOffset = clonedRange.endOffset;
            return true;
          }
        }
        end = 0;
      } while ((node = this._getNextTextNode(clonedRange)));
    }
    return false;
  }

  /**
   * @param {Range} range
   * @private
   */
  _expandRangeByWord(range) {
    const { startContainer, endContainer } = range;

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
        range.setEnd(endContainer, origin -= 1);
        break;
      }
      origin += 1;
      range.setEnd(endContainer, origin);
    }
  }

  /**
   * @param {Range} range
   * @param {Number} expandBound
   * @private
   */
  _expandRangeBySentence(range, expandBound = -1) {
    const origin = range.endOffset;
    range.expand('sentence');

    if (expandBound < 0) {
      return;
    }

    let end = range.endOffset;
    while (end > origin) {
      if (range.getAdjustedBoundingClientRect().right <= expandBound) {
        break;
      }
      range.setEnd(range.endContainer, end -= 1);
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
   * @param {Range} range
   * @returns {Boolean}
   * @private
   */
  _isValid(range) {
    if (range.toString().length > this._maxLength) {
      if (!this._isOverflowed) {
        _Util.toast(`최대 ${this._maxLength}자까지 선택할 수 있습니다.`);
      }
      this._isOverflowed = true;
    } else {
      this._isOverflowed = false;
    }
    return !this._isOverflowed;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {Node} rootNode
   * @param {String} unit (character or word)
   * @param {Boolean} allowCollapsed
   * @returns {TextRange|null}
   * @private
   */
  _getCaretRange(x, y, rootNode, unit = 'word', allowCollapsed = false) {
    const point = this.reader.adjustPoint(x, y);
    const range = _Util.getCaretRange(point.x, point.y, rootNode, unit);
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
   * @returns {Boolean}
   */
  isOutOfBounds(/* range */) {
    return false;
  }

  /**
   * @returns {Range}
   */
  getRange() {
    const range = document.createRange();
    range.setStart(this._startContainer, this._startOffset);
    range.setEnd(this._endContainer, this._endOffset);
    return range;
  }

  /**
   * @returns {MutableClientRectList}
   */
  getRects() {
    return this.getRange().getAdjustedTextRects();
  }

  /**
   * @returns {String}
   */
  getText() {
    return this.getRange().toString();
  }
}
