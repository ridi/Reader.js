import SpeechUtil from './SpeechUtil';
import Util from '../common/Util';

const { DOCUMENT_POSITION_FOLLOWING, DOCUMENT_POSITION_PRECEDING, TEXT_NODE } = Node;

/**
 * @class _Sel
 * @private @property {Reader} _reader
 * @private @property {Content} _content
 * @private @property {Context} _context
 * @private @property {Node} _startContainer
 * @private @property {number} _startOffset
 * @private @property {Node} _endContainer
 * @private @property {number} _endOffset
 * @private @property {boolean} _isOverflowed
 * @private @property {Node} _continueContainer
 * @private @property {number} _continueOffset
 */
export default class _Sel {
  /**
   * @returns {boolean}
   */
  get isExpandContinuableIntoNextPage() {
    return this._isExpandContinuableIntoNextPage(this.getRange());
  }

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
    this._maxLength = content._context.maxSelectionLength;
    this._init();
  }

  _init() {
    this._startContainer = null;
    this._startOffset = null;
    this._endContainer = null;
    this._endOffset = null;
    this._isOverflowed = false;
    this._continueContainer = null;
    this._continueOffset = null;
    this._caretIterator = null;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {?string} unit character or word
   * @returns {boolean}
   */
  start(x, y, unit) {
    const range = this._getCaretRange(x, y, unit);
    if (range === null) {
      return false;
    }

    // 처음 선택시에는 붙어있는 특수문자까지 모두 포함시킨다.
    this._expandRangeByWord(range);

    this._startContainer = range.startContainer;
    this._startOffset = range.startOffset;
    this._endContainer = range.endContainer;
    this._endOffset = range.endOffset;

    return true;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {?string} unit character or word
   * @returns {boolean}
   */
  expandIntoUpper(x, y, unit = 'character') {
    const exRange = this._getCaretRange(x, y, unit, true);
    if (exRange === null) {
      return false;
    }

    const containerDiff = this._endContainer.compareDocumentPosition(exRange.startContainer);
    if (containerDiff === DOCUMENT_POSITION_FOLLOWING ||
      (containerDiff === 0 && this._endOffset < exRange.startOffset)) {
      return false;
    }

    if (exRange.startContainer === this._startContainer && exRange.startOffset === this._startOffset) {
      return false;
    }

    // selection이 상위 div 등의 배경에 거친 경우 offset들은 childNode의 index이므로 해당 childNode를 start/end container로 설정한다.
    if (exRange.startContainer.childNodes.length) {
      exRange.setStart(exRange.startContainer.childNodes[exRange.startOffset], 0);
    }
    if (exRange.endContainer.childNodes.length) {
      exRange.setEnd(
        exRange.endContainer.childNodes[exRange.endOffset],
        exRange.endContainer.childNodes[exRange.endOffset].textContent.length,
      );
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
   * @param {number} x
   * @param {number} y
   * @param {?string} unit character or word
   * @returns {boolean}
   */
  expandIntoLower(x, y, unit = 'character') {
    const exRange = this._getCaretRange(x, y, unit, true);
    if (exRange === null) {
      return false;
    }

    const containerDiff = this._startContainer.compareDocumentPosition(exRange.endContainer);
    if (containerDiff === DOCUMENT_POSITION_PRECEDING ||
      (containerDiff === 0 && this._startOffset > exRange.endOffset)) {
      return false;
    }

    if (exRange.endContainer === this._endContainer && exRange.endOffset === this._endOffset) {
      return false;
    }

    // selection이 상위 div 등의 배경에 거친 경우 offset들은 childNode의 index이므로 해당 childNode를 start/end container로 설정한다.
    if (exRange.startContainer.childNodes.length) {
      exRange.setStart(exRange.startContainer.childNodes[exRange.startOffset], 0);
    }
    if (exRange.endContainer.childNodes.length) {
      exRange.setEnd(
        exRange.endContainer.childNodes[exRange.endOffset],
        exRange.endContainer.childNodes[exRange.endOffset].textContent.length,
      );
    }

    if (this._isOutOfBounds(exRange)) {
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
   * @returns {boolean}
   */
  expandIntoNextPage() {
    if (!this.isExpandContinuableIntoNextPage) {
      return false;
    }

    this._endContainer = this._continueContainer;
    this._endOffset = this._continueOffset;

    return true;
  }

  end() {
    this._init();
  }

  /**
   * @returns {number}
   * @private
   */
  _getUpperBound() {
    return 0;
  }

  /**
   * @param {Range} range
   * @returns {boolean}
   * @private
   */
  _isExpandContinuableIntoNextPage(range) {
    if (!this._context.isScrollMode) {
      const upperBound = this._getUpperBound();
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
    // FIXME: SpeechUtil 의존성 제거
    const tables = [SpeechUtil.chineseCodeTable(), SpeechUtil.japaneseCodeTable()];
    if (SpeechUtil.getContainCharRegex(tables).test(range.toString())) {
      range.expand('character');
      return;
    }

    let { startContainer } = range;
    let offset = range.startOffset;
    while (offset >= 0) {
      const { textContent } = startContainer;
      const previousSibling = startContainer.previousSibling || startContainer.parentNode.previousSibling;
      if (/^\s/.test(range.toString())) {
        range.setStart(startContainer, Math.min(offset + 1, textContent.length));
        break;
      }
      offset -= 1;
      if (offset < 0) {
        if (previousSibling !== null) {
          startContainer = startContainer.childNodes.length > 0
            ? startContainer.childNodes[startContainer.childNodes.length - 1]
            : previousSibling;
          offset = startContainer.textContent.length;
        } else {
          break;
        }
      }
      range.setStart(startContainer, offset);
    }

    let { endContainer } = range;
    offset = range.endOffset;
    while (offset <= endContainer.textContent.length) {
      const { textContent } = endContainer;
      const nextSibling = endContainer.nextSibling || endContainer.parentNode.nextSibling;
      if (/\s$/.test(range.toString())) {
        range.setEnd(endContainer, offset);
        break;
      }
      offset += 1;
      if (offset > textContent.length) {
        if (nextSibling !== null) {
          endContainer = nextSibling;
          offset = 0;
          if (endContainer.childNodes.length) {
            [endContainer] = endContainer.childNodes;
          }
        } else {
          break;
        }
      }
      range.setEnd(endContainer, offset);
    }
  }

  /**
   * @param {Range} range
   * @param {number} expandBound
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
      if (range.getBoundingClientRect().toRect().right <= expandBound) {
        break;
      }
      range.setEnd(range.endContainer, end -= 1);
    }
  }

  /**
   * @param {Range} range
   * @returns {?Node}
   * @private
   */
  _getNextTextNode(range) {
    const node = range.endContainer;
    const nextNode = node.nextSibling;
    if (nextNode) {
      if (nextNode.nodeType === TEXT_NODE) {
        // case 1-1:
        // p
        //   text (node)
        //   text (nextNode)
        return nextNode;
      }

      const textNode = Util.createTextNodeIterator(nextNode).nextNode();
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
   * @returns {boolean}
   * @private
   */
  _isValid(range) {
    if (range.toString().length > this._maxLength) {
      if (!this._isOverflowed) {
        this._context.onMessage(`최대 ${this._maxLength}자까지 선택할 수 있습니다.`);
      }
      this._isOverflowed = true;
    } else {
      this._isOverflowed = false;
    }
    return !this._isOverflowed;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {?string} unit character or word
   * @returns {?Range}
   */
  _caretRangeFromPoint(x, y, unit = 'word') {
    if (this._context.isSameDomAsUi) {
      if (this._caretIterator) {
        this._caretIterator.previousNode();
      } else {
        this._caretIterator = Util.createTextNodeIterator(this._content.ref, (textNode) => { // eslint-disable-line
          return textNode.parentElement
            .getBoundingClientRect()
            .toRect()
            .contains(x, y);
        });
      }

      let node;
      while ((node = this._caretIterator.nextNode())) {
        const range = document.createRange();
        range.selectNodeContents(node);

        const fontSize = Util.getStylePropertyValue(node.parentElement, 'fontSize');
        const lineHeight = Util.getStylePropertyValue(node.parentElement, 'lineHeight');
        const { length } = range.toString();
        for (let i = 0; i < length; i++) {
          range.setStart(range.startContainer, i);
          range.setEnd(range.endContainer, Math.min(i + 1, length));
          if (/^\s*$/.test(range.toString())) {
            continue;
          }

          const rect = range.getBoundingClientRect()
            .toRect()
            .inset(0, 0, 0, Math.max(lineHeight - fontSize, 0));
          if (rect.contains(x, y)) {
            range.expand(unit);
            return range;
          }

          if (i === length - 1 &&
            node.parentElement.getBoundingClientRect().toRect().contains(x, y) &&
            rect.minY < y && y < rect.maxY) {
            range.expand(unit);
            return range;
          }
        }
      }
      this._caretIterator = null;
      return null;
    }
    return document.caretRangeFromPoint(x, y);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {string} unit character or word
   * @param {boolean} allowCollapsed
   * @returns {?Range}
   * @private
   */
  _getCaretRange(x, y, unit = 'word', allowCollapsed = false) {
    const range = this._caretRangeFromPoint(x, y, this._content.ref, unit);
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
   * @returns {boolean}
   * @private
   */
  _isOutOfBounds(/* range */) {
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
   * @returns {string}
   */
  getSerializedRange() {
    return this.getRange().toSerializedRange(this._content.ref);
  }

  /**
   * @returns {RectList}
   */
  getRectList() {
    return this.getRange().getTextRectList().trim().toAbsolute();
  }

  /**
   * @returns {string}
   */
  getText() {
    return this.getRange().toString();
  }
}
