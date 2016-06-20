import _Util from './_Util';
import _App from './_App';
import TTSUtil from './tts/TTSUtil';

export default class _Sel {
  get continuable() { return this._continuable; }

  constructor(maxLength = 0) {
    this._maxLength = maxLength;
    this._startContainer = null;
    this._startOffset = null;
    this._endContainer = null;
    this._endOffset = null;
    this._overflowed = false;
    this._continuable = false; // PageBased mode only
    this._continueOffset = null;
  }

  _caretRangeFromPoint(x, y, expand = 'word', allowCollapsed = false) {
    const point = _Util.adjustPoint(x, y);
    const range = document.caretRangeFromPoint(point.x, point.y);
    if (range === null) {
      return null;
    }

    range.expand(expand);
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

  startSelectionMode(x, y, expand) {
    this._continuable = false;

    const range = this._caretRangeFromPoint(x, y, expand);
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

  changeInitialSelection(x, y, expand) {
    this._continuable = false;

    const range = this._caretRangeFromPoint(x, y, expand);
    if (range === null) {
      return false;
    }

    this._startContainer = range.startContainer;
    this._startOffset = range.startOffset;
    this._endContainer = range.endContainer;
    this._endOffset = range.endOffset;

    return true;
  }

  extendUpperSelection(x, y, expand = 'character') {
    const exRange = this._caretRangeFromPoint(x, y, expand, true);
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

  extendLowerSelection(x, y, expand = 'character') {
    const exRange = this._caretRangeFromPoint(x, y, expand, true);
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

    if (!app.scrollMode) {
      const textLength = this._endContainer.textContent.length;
      let endOffset = this._endOffset;
      while (textLength - 1 > endOffset) {
        // TODO: 다음 페이지의 한 글자만 선택되는 것을 최대 두~세 단어가 선택되도록
        exRange.setStart(exRange.endContainer, endOffset);
        exRange.setEnd(exRange.endContainer, ++endOffset);
        if (!(/\s/.test(exRange.toString())) && exRange.getAdjustedBoundingClientRect().left >= app.pageWidthUnit) {
          this._continuable = true;
          this._continueOffset = endOffset;
          break;
        }
      }
    }

    return true;
  }

  expandNextPage() {
    if (!this.continuable) {
      return false;
    }

    this._endOffset = this._continueOffset;
    this._continuable = false;

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
