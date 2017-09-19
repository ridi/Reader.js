import _Object from './_Object';
import _Util from './_Util';
import MutableClientRect from './MutableClientRect';

export default class _Reader extends _Object {
  /**
   * @returns {Content}
   */
  get content() { return this._content; }

  /**
   * @returns {Handler}
   */
  get handler() { return this._handler; }

  /**
   * @returns {Sel}
   */
  get sel() { return this._sel; }

  /**
   * @returns {Context}
   */
  get context() { return this._context; }

  /**
   * @returns {Number}
   */
  get totalWidth() { return this._wrapper.scrollWidth; }

  /**
   * @returns {Number}
   */
  get totalHeight() { return this._wrapper.scrollHeight; }

  /**
   * @returns {Number}
   */
  get totalSize() { return this.context.isScrollMode ? this.totalHeight : this.totalWidth; }

  /**
   * @returns {Number}
   */
  get pageXOffset() { return window.pageXOffset; }

  /**
   * @returns {Number}
   */
  get pageYOffset() { return window.pageYOffset; }

  /**
   * @returns {Number} (webView or element scrollOffset)
   */
  get pageOffset() { return this.context.isScrollMode ? this.pageYOffset : this.pageXOffset; }

  /**
   * @returns {Number} (zero-base)
   */
  get curPage() { return this.pageOffset / this.context.pageUnit; }

  /**
   * @param {HTMLElement} wrapper
   * @param {Context} context
   */
  constructor(wrapper, context) {
    super();
    this._wrapper = wrapper;
    this._context = context;
    this.debugNodeLocation = false;
    this.methodSwizzling();
  }

  methodSwizzling() {
    const reader = this;

    Range.prototype.originGetClientRects = Range.prototype.getClientRects;

    /**
     * @returns {ClientRect[]}
     */
    function getClientRects() {
      const rects = this.originGetClientRects();
      if (rects === null) {
        return [];
      }

      const newRects = [];
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        if (rect.width <= 1) {
          // Webkit, Chrome 버전에 따라 다음 페이지의 첫 글자를 선택했을 때
          // 마지막 rect의 너비가 1 이하인 값이 들어오게 되는데 이게 오작동을
          // 발생시키는 요인이 되기 때문에 버린다.
          continue;
        }
        newRects.push(rect);
      }
      return newRects;
    }

    Range.prototype.getClientRects = getClientRects;

    /**
     * @returns {MutableClientRect}
     */
    function getAdjustedBoundingClientRect() {
      return reader._adjustRect(this.getBoundingClientRect() || new MutableClientRect());
    }

    /**
     * @returns {MutableClientRect[]}
     */
    function getAdjustedClientRects() {
      return reader._adjustRects(this.getClientRects() || []);
    }

    Range.prototype.getAdjustedBoundingClientRect = getAdjustedBoundingClientRect;
    Range.prototype.getAdjustedClientRects = getAdjustedClientRects;

    HTMLElement.prototype.getAdjustedBoundingClientRect = getAdjustedBoundingClientRect;
    HTMLElement.prototype.getAdjustedClientRects = getAdjustedClientRects;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {{x: Number, y: Number}}
   * @private
   */
  _adjustPoint(x, y) {
    return { x, y };
  }

  /**
   * @param {ClientRect} rect
   * @returns {MutableClientRect}
   * @private
   */
  _adjustRect(rect) {
    return new MutableClientRect(rect);
  }

  /**
   * @param {ClientRect[]} rects
   * @returns {MutableClientRect[]}
   * @private
   */
  _adjustRects(rects) {
    return _Util.concatArray([], rects, this._adjustRect);
  }

  /**
   * @param {Context} context
   */
  changeContext(context) {
    this._context = context;
    this._handler.changeContext(context);
    this._sel.changeContext(context);
  }

  /**
   * @param {Number} offset
   */
  scrollTo(offset) {
    if (this.context.isScrollMode) {
      scroll(0, offset);
    } else {
      scroll(offset, 0);
    }
  }

  /**
   * el의 rect 기준점을 반환한다.
   *
   * @param {Node} el
   * @returns {String} (top or left)
   */
  getOffsetDirectionFromElement(el) {
    let direction = this.context.isScrollMode ? 'top' : 'left';
    if (el) {
      const position = _Util.getMatchedCSSValue(el, 'position', true);
      if (direction === 'left' && position === 'absolute') {
        direction = 'top';
      }
    }
    return direction;
  }

  /**
   * @param {String} anchor
   * @param {function} block
   * @returns {Number}
   * @private
   */
  _getOffsetFromAnchor(anchor, block) {
    const el = document.getElementById(anchor);
    if (el) {
      const iterator = _Util.createTextNodeIterator(el);
      const node = iterator.nextNode();
      if (node) {
        // 첫번째 텍스트만 확인
        const range = document.createRange();
        range.selectNodeContents(node);

        const display = window.getComputedStyle(el).display;
        const rects = range.getAdjustedClientRects();
        if (rects.length) {
          return block(rects[0], el);
        } else if (display === 'none') {
          el.style.display = 'block';
          const rect = el.getAdjustedBoundingClientRect();
          el.style.display = 'none';
          return block(rect, el);
        }
      }

      // 텍스트 노드 없는 태그 자체에 anchor가 걸려있으면
      return block(el.getAdjustedBoundingClientRect(), el);
    }
    return block({ left: null, top: null }, null);
  }

  /**
   * anchor의 위치를 구한다.
   * 페이지 넘김 보기일 경우 pageOffset(zero-base)을 반환하며,
   * 스크롤 보기일 경우 scrollY 값을 반환한다.
   * 위치를 찾을 수 없을 경우 null을 반환한다.
   *
   * @param {String} anchor
   * @returns {Number|null}
   */
  getOffsetFromAnchor(anchor) {
    return this._getOffsetFromAnchor(anchor, (rect, el) => {
      if (this.context.isScrollMode) {
        return rect.top === null ? null : rect.top + this.pageYOffset;
      }
      return rect.left === null ? null : this.getPageFromRect(rect, el);
    });
  }

  /**
   * serializedRange(rangy.js 참고)의 위치를 구한다.
   * 페이지 넘김 보기일 경우 page(zero-base)를 반환하며,
   * 스크롤 보기일 경우 scrollY 값을 반환한다.
   * 위치를 찾을 수 없을 경우 null을 반환한다.
   *
   * @param {String} serializedRange
   * @returns {Number|null}
   */
  getOffsetFromSerializedRange(serializedRange) {
    try {
      const range = this.getRangeFromSerializedRange(serializedRange);
      const rects = range.getAdjustedClientRects();
      if (rects.length > 0) {
        if (this.context.isScrollMode) {
          return rects[0].top + this.pageYOffset;
        }
        return this.getPageFromRect(rects[0]);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * rects 중에 startOffset~endOffset 사이에 위치한 rect의 index를 반환한다.
   * type이 bottom일 때 -1을 반환하는 경우가 있을 수 있는데 이전 rects에 마지막 rect를 의미한다.
   *
   * @param {MutableClientRect[]} rects
   * @param {Number} startOffset
   * @param {Number} endOffset
   * @param {String} type (top or bottom)
   * @returns {Number|null}
   * @private
   */
  _findRectIndex(rects, startOffset, endOffset, type = 'top') {
    const origin = this.context.isScrollMode ? 'top' : 'left';
    for (let j = 0; j < rects.length; j++) {
      const rect = rects[j];
      if (type === 'bottom') {
        if (endOffset <= rect[origin] && rect.width > 0) {
          return j - 1;
        }
      } else if (startOffset <= rect[origin] && rect[origin] <= endOffset && rect.width > 0) {
        return j;
      }
    }
    return null;
  }

  /**
   * startOffset과 endOffset 사이에 위치한 node의 NodeLocation을 반환한다.
   * type으로 startOffset에 근접한 위치(top)를 찾을 것인지 endOffset에 근접한 위치(bottom)를 찾을 것인지 정할 수 있다.
   *
   * @param {Number} startOffset
   * @param {Number} endOffset
   * @param {String} type (top or bottom)
   * @param {String} posSeparator
   * @returns {String|null}
   */
  findNodeLocation(startOffset, endOffset, type = 'top', posSeparator = '#') {
    // 디버깅용으로 NodeLocation을 화면에 표시할 때 사용한다.
    this._latestNodeRect = null;

    const nodes = this.content.nodes;
    if (!nodes) {
      return null;
    }

    // 현재 페이지에 위치한 노드 정보를 임시로 저장한 것으로 BottomNodeLocation을 구할 때 사용한다.
    let prev = null;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const range = document.createRange();
      range.selectNodeContents(node);

      const rect = range.getAdjustedBoundingClientRect();
      if (!rect) {
        return null;
      }

      // node가 여러 페이지에 걸쳐있을 때 현재 페이지도 포함하고 있는지.
      const origin = this.context.isScrollMode ? (rect.top + rect.height) : (rect.left + rect.width);
      if (rect.width === 0 || origin < startOffset) {
        continue;
      }

      let rectIndex;
      if (node.nodeType === Node.TEXT_NODE) {
        const string = node.nodeValue;
        if (!string) {
          continue;
        }

        const words = string.split(this.getSplitWordRegex());
        let offset = range.startOffset;
        for (let j = 0; j < words.length; j++) {
          const word = words[j];
          if (word.trim().length) {
            try {
              range.setStart(node, offset);
              range.setEnd(node, offset + word.length);
            } catch (e) {
              return null;
            }
            const rects = range.getAdjustedClientRects();
            if ((rectIndex = this._findRectIndex(rects, startOffset, endOffset, type)) !== null) {
              if (rectIndex < 0) {
                this._latestNodeRect = prev.rect;
                return prev.location;
              }
              this._latestNodeRect = rects[rectIndex];
              return (i + posSeparator + Math.min(j + rectIndex, words.length - 1));
            }
            for (let k = rects.length - 1; k >= 0; k--) {
              if (rects[k].left < endOffset) {
                prev = { location: `${i}${posSeparator}${j}`, rect: rects[k] };
              }
            }
          }
          offset += (word.length + 1);
        }
      } else if (node.nodeName === 'IMG') {
        const rects = range.getAdjustedClientRects();
        if ((rectIndex = this._findRectIndex(rects, startOffset, endOffset, type)) !== null) {
          if (rectIndex < 0) {
            this._latestNodeRect = prev.rect;
            return prev.location;
          }
          this._latestNodeRect = rects[rectIndex];
          // imageNode는 wordIndex를 구할 수 없기 때문에 0을 넣는다.
          return `${i}${posSeparator}0`;
        }
        for (let k = rects.length - 1; k >= 0; k--) {
          if (rects[k].left < endOffset) {
            prev = { location: `${i}${posSeparator}0`, rect: rects[k] };
          }
        }
      }
    }

    return null;
  }

  /**
   * 마지막으로 구한 NodeLocation을 화면에 표시한다.
   */
  showNodeLocationIfNeeded() {
    if (!this.debugNodeLocation || this._latestNodeRect === null) {
      return;
    }

    let span = document.getElementById('RidiNodeLocation');
    if (!span) {
      span = document.createElement('span');
      span.setAttribute('id', 'RidiNodeLocation');
      this.content.wrapper.appendChild(span);
    }

    const rect = this._latestNodeRect;
    rect[this.context.isScrollMode ? 'top' : 'left'] = this.pageOffset;
    span.style.cssText =
      'position: absolute !important;' +
      'background-color: red !important;' +
      `left: ${rect.left}px !important;` +
      `top: ${rect.top}px !important;` +
      `width: ${(rect.width || 3)}px !important;` +
      `height: ${rect.height}px !important;` +
      'display: block !important;' +
      'opacity: 0.4 !important;' +
      'z-index: 99 !important;';
  }

  /**
   * NodeLocation의 위치를 구한다.
   * 페이지 넘김 보기일 경우 page(zero-base)를 반환하며,
   * 스크롤 보기일 경우 scrollY 값을 반환한다.
   * 위치를 찾을 수 없을 경우 null을 반환한다.
   *
   * @param {String} location
   * @param {String} type (top or bottom)
   * @param {String} posSeparator
   * @returns {Number|null}
   */
  getOffsetFromNodeLocation(location, type = 'top', posSeparator = '#') {
    const parts = location.split(posSeparator);
    const nodeIndex = parts[0];
    const wordIndex = parts[1];
    const pageUnit = this.pageUnit;
    const totalSize = this.totalSize;
    const isScrollMode = this.context.isScrollMode;

    const nodes = this.content.nodes;
    if (nodeIndex === -1 || wordIndex === -1 || nodes === null) {
      return null;
    }

    const node = nodes[nodeIndex];
    if (!node) {
      return null;
    }

    const range = document.createRange();
    range.selectNodeContents(node);

    let rect = range.getAdjustedBoundingClientRect();
    if (rect.left === 0 && rect.top === 0 && rect.right === 0 && rect.bottom === 0) {
      return null;
    }

    let page = this.getPageFromRect(rect);
    if (page === null || totalSize <= pageUnit * page) {
      return null;
    }

    if (node.nodeName === 'IMG' && wordIndex === 0) {
      if (isScrollMode) {
        return Math.max((rect.top + this.pageYOffset) - (type === 'bottom' ? pageUnit : 0), 0);
      }
      return page;
    }

    const string = node.nodeValue;
    if (string === null) {
      return null;
    }

    const words = string.split(_Util.getSplitWordRegex());
    let word;
    let offset = 0;
    for (let i = 0; i <= Math.min(wordIndex, words.length - 1); i++) {
      word = words[i];
      offset += (word.length + 1);
    }
    try {
      range.setStart(range.startContainer, offset - word.length - 1);
      range.setEnd(range.startContainer, offset - 1);
    } catch (e) {
      return null;
    }

    rect = range.getAdjustedBoundingClientRect();
    page = this.getPageFromRect(rect);
    if (page === null || totalSize <= pageUnit * page) {
      return null;
    }

    if (rect.left < 0 || (page + 1) * pageUnit < rect.left + rect.width) {
      if (rect.width < pageUnit) {
        page += 1;
      } else {
        page += Math.floor(rect.width / pageUnit);
      }
    }

    if (isScrollMode) {
      return Math.max((rect.top + this.pageYOffset) - (type === 'bottom' ? pageUnit : 0), 0);
    }
    return page;
  }

  /**
   * @param {String} keyword
   * @returns {String}
   */
  searchText(keyword) {
    if (find(keyword, 0)) { // Case insensitive
      return rangy.serializeRange(getSelection().getRangeAt(0), true, this.content.body);
    }
    return 'null';
  }

  /**
   * @param {Number} pre
   * @param {Number} post
   * @returns {String}
   */
  textAroundSearchResult(pre, post) {
    const range = getSelection().getRangeAt(0);

    const startOffset = range.startOffset;
    const newStart = Math.max(range.startOffset - pre, 0);

    const endOffset = range.endOffset;
    const newEnd = Math.min(newStart + post, range.endContainer.length);

    range.setStart(range.startContainer, newStart);
    range.setEnd(range.endContainer, newEnd);

    const result = range.toString();
    range.setStart(range.startContainer, startOffset);
    range.setEnd(range.endContainer, endOffset);

    return result;
  }

  /**
   * @returns {MutableClientRect[]}
   */
  getRectsOfSearchResult() {
    return getSelection().getRangeAt(0).getAdjustedClientRects();
  }

  /**
   * @returns {Number} (zero-base)
   */
  getPageOfSearchResult() {
    const rects = this.getRectsOfSearchResult();
    return this.getPageFromRect(rects[0]);
  }

  /**
   * @param {String} serializedRange
   * @returns {Range}
   */
  static getRangeFromSerializedRange(serializedRange) {
    const tmpRange = rangy.deserializeRange(serializedRange, this.content.body);
    const range = document.createRange();
    range.setStart(tmpRange.startContainer, tmpRange.startOffset);
    range.setEnd(tmpRange.endContainer, tmpRange.endOffset);
    tmpRange.detach();
    return range;
  }

  /**
   * @param {String} serializedRange
   * @returns {MutableClientRect[]}
   */
  static getRectsFromSerializedRange(serializedRange) {
    const range = this.getRangeFromSerializedRange(serializedRange);
    return this.getOnlyTextNodeRectsFromRange(range);
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
      const innerText = range.startContainer.innerText;
      if (innerText !== undefined && innerText.length === 0) {
        return [];
      }
      return range.getAdjustedClientRects();
    }

    const iterator = this.createTextNodeIterator(range.commonAncestorContainer);
    let textNodeRects = [];

    let workRange = document.createRange();
    workRange.setStart(range.startContainer, range.startOffset);
    workRange.setEnd(range.startContainer, range.startContainer.length);
    textNodeRects = this.concatArray(textNodeRects, workRange.getAdjustedClientRects());

    let node;
    while ((node = iterator.nextNode())) {
      // startContainer 노드보다 el이 앞에 있으면
      if (range.startContainer.compareDocumentPosition(node) === Node.DOCUMENT_POSITION_PRECEDING ||
        range.startContainer === node) {
        continue;
      }

      // endContainer 뒤로 넘어가면 멈춤
      if (range.endContainer.compareDocumentPosition(node) === Node.DOCUMENT_POSITION_FOLLOWING ||
        range.endContainer === node) {
        break;
      }

      workRange = document.createRange();
      workRange.selectNodeContents(node);
      if (this._isWhiteSpaceRange(workRange)) {
        continue;
      }

      textNodeRects = _Util.concatArray(textNodeRects, workRange.getAdjustedClientRects());
    }

    workRange = document.createRange();
    workRange.setStart(range.endContainer, 0);
    workRange.setEnd(range.endContainer, range.endOffset);
    if (!this._isWhiteSpaceRange(workRange)) {
      textNodeRects = _Util.concatArray(textNodeRects, workRange.getAdjustedClientRects());
    }

    return textNodeRects;
  }
}
