import _Util from './_Util';
import _App from './_App';
import TTSUtil from './tts/TTSUtil';

export default class _Sel {
  get nextPageContinuable() { return this._checkNextPageContinuable(this.getSelectedRange()); }

  constructor(maxLength = 0) {
    this._maxLength = maxLength;
    this._startContainer = null;
    this._startOffset = null;
    this._endContainer = null;
    this._endOffset = null;
    this._overflowed = false; // 셀렉션 글자수 제한을 넘긴 상태인지
    this._nextPageContinuable = false; // 다음 페이지로 이어서 셀렉션을 할 수 있는지(페이지 모드 전용)
    this._continueContainer = null;
    this._continueOffset = null;
  }

  _caretRangeFromPoint(x, y, unit = 'word', allowCollapsed = false) {
    const point = _Util.adjustPoint(x, y);
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

  _expandRangeByWord(range) {
    const startContainer = range.startContainer;
    if (startContainer.nodeValue === null) {
      return;
    }

    const tables = [TTSUtil.chineseCodeTable(), TTSUtil.japaneseCodeTable()];
    if (TTSUtil.getContainCharRegex(tables).test(range.toString())) {
      range.expand('character');
      return;
    }

    const containerValueLength = startContainer.nodeValue.length;
    let startOffset = range.startOffset;
    let originalOffset = startOffset;

    while (startOffset > 0) {
      if (/^\s/.test(range.toString())) {
        range.setStart(startContainer, startOffset += 1);
        break;
      }
      startOffset -= 1;
      range.setStart(startContainer, startOffset);
    }

    while (originalOffset < containerValueLength) {
      if (/\s$/.test(range.toString())) {
        range.setEnd(startContainer, originalOffset -= 1);
        break;
      }
      originalOffset += 1;
      range.setEnd(startContainer, originalOffset);
    }
  }

  isOutOfBounds(range) {
    return false;
  }

  startSelectionMode(x, y, unit) {
    const range = this._caretRangeFromPoint(x, y, unit);
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

    if (exRange.endContainer === this._endContainer &&
      exRange.endOffset === this._endOffset) {
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

  getUpperBound() {
    return app.pageWidthUnit;
  }

  _checkNextPageContinuable(range) {
    if (!app.scrollMode) {
      const upperBound = this.getUpperBound();
      const dummyRange = range.cloneRange();
      let node = dummyRange.endContainer;
      let endOffset = dummyRange.endOffset;
      do {
        const length = node.textContent.length;
        while (length > endOffset) {
          dummyRange.setStart(node, endOffset);
          dummyRange.setEnd(node, ++endOffset);
          const rect = dummyRange.getAdjustedBoundingClientRect();
          if (/\s/.test(dummyRange.toString())) {
            continue;
          } else if (Math.floor(rect.left + rect.width) < upperBound) {
            return (this._nextPageContinuable = false);
          } else {
            this._expandRangeBySentenceInPage(dummyRange, upperBound * 2);
            this._continueContainer = dummyRange.endContainer;
            this._continueOffset = dummyRange.endOffset;
            return (this._nextPageContinuable = true);
          }
        }
        endOffset = 0;
        this._nextPageContinuable = false;
      } while ((node = this._getNextTextNode(dummyRange)));
    }
    return this._nextPageContinuable;
  }

  _expandRangeBySentenceInPage(range, upperBound) {
    const originalOffset = range.endOffset;
    range.expand('sentence');

    let endOffset = range.endOffset;
    while (endOffset > originalOffset) {
      if (/\s$/.test(range.toString())) {
        range.setEnd(range.endContainer, endOffset -= 1);
        continue;
      } else if (range.getAdjustedBoundingClientRect().right <= upperBound) {
        break;
      }
      range.setEnd(range.endContainer, endOffset -= 1);
    }
  }

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

  expandSelectionIntoNextPage() {
    if (!this._nextPageContinuable) {
      return false;
    }

    this._endContainer = this._continueContainer;
    this._endOffset = this._continueOffset;
    this._nextPageContinuable = false;

    return true;
  }

  validLength(range) {
    if (!(range.toString().length <= this._maxLength)) {
      if (!this._overflowed) {
        _App.toast(`최대 ${this._maxLength}자까지 선택할 수 있습니다`);
      }
      this._overflowed = true;
      return false;
    }
    return true;
  }

  getSelectedRange() {
    const range = document.createRange();
    range.setStart(this._startContainer, this._startOffset);
    range.setEnd(this._endContainer, this._endOffset);
    return range;
  }

  getSelectedSerializedRange() {
    return rangy.serializeRange(this.getSelectedRange(), true, document.body);
  }

  getSelectedRangeRects() {
    return _Util.getOnlyTextNodeRectsFromRange(this.getSelectedRange());
  }

  getSelectedText() {
    return this.getSelectedRange().toString();
  }

  getSelectedRectsCoord() {
    const rects = this.getSelectedRangeRects();
    if (rects.length) {
      this._overflowed = false;
      return _Util.rectsToAbsoluteCoord(rects);
    }
    return '';
  }
}
