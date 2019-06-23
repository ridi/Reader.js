import Util from '../common/Util';
import Rect from './Rect';
import RectList from './RectList';

const { DOCUMENT_POSITION_PRECEDING, DOCUMENT_POSITION_FOLLOWING, DOCUMENT_POSITION_CONTAINED_BY } = Node;

/**
 * @class _Reader
 * @private @property {HTMLElement} _wrapper
 * @private @property {Context} _context
 * @property {boolean} debugNodeLocation
 * @property {?Rect} lastNodeLocationRect 마지막으로 구한 NodeLocation을 화면에 표시할 때 사용한다. (디버깅용)
 */
export default class _Reader {
  /**
   * @returns {Content[]}
   */
  get contents() { return this._contents; }

  /**
   * @returns {Context}
   */
  get context() { return this._context; }

  /**
   * @param {Context} newValue
   */
  set context(newValue) {
    this._context = newValue;
    if (newValue.shouldViewportInitialize) {
      this._setViewport();
    }
  }

  /**
   * @returns {number}
   */
  get totalWidth() { return this._wrapper.scrollWidth; }

  /**
   * @returns {number}
   */
  get totalHeight() { return this._wrapper.scrollHeight; }

  /**
   * @returns {mumber}
   */
  get totalSize() { return this.context.isScrollMode ? this.totalHeight : this.totalWidth; }

  /**
   * @returns {number}
   */
  get pageXOffset() { return window.pageXOffset; }

  /**
   * @returns {number}
   */
  get pageYOffset() { return window.pageYOffset; }

  /**
   * @returns {number}
   */
  get pageOffset() { return this.context.isScrollMode ? this.pageYOffset : this.pageXOffset; }

  /**
   * @returns {number} zero-based page number
   */
  get curPage() { return this.pageOffset / this.context.pageUnit; }

  /**
   * @param {Context} context
   */
  constructor(context) {
    this._injectMethod();
    this._wrapper = document.documentElement;
    this.context = context;
    this.debugNodeLocation = false;
    this.lastNodeLocationRect = null;
  }

  /**
   * @param {HTMLElement} ref
   * @param {?HTMLElement} wrapper
   */
  setContent(ref, wrapper) {
    this.setContents([ref], wrapper);
  }

  /**
   * @param {HTMLElement[]} refs
   * @param {?HTMLElement} wrapper
   */
  setContents(refs, wrapper) {
    this._wrapper = wrapper || document.documentElement;
    this._contents = [];
    refs.forEach((ref) => {
      this._contents.push(this._createContent(ref));
    });
  }

  /**
   * @param {HTMLElement} ref
   * @returns {Content}
   * @private
   */
  _createContent(/* ref */) {
    return null;
  }

  /**
   * @param {HTMLElement|number} key
   * @returns {?Content}
   */
  getContent(key) {
    if (typeof key === 'number') {
      return this.contents[key];
    }
    return this.contents.find(content => content.ref === key);
  }

  /**
   * @private
   */
  _injectMethod() {
    const injectIfNeeded = (target, name, value) => {
      if (!target[name]) {
        target[name] = value;
      }
    };

    injectIfNeeded(Range.prototype, 'getTextRectList', function getTextRectList() {
      const {
        startContainer,
        startOffset,
        endContainer,
        endOffset,
        commonAncestorContainer,
      } = this;
      if (startContainer === endContainer) {
        const { innerText } = startContainer;
        if (innerText !== undefined && innerText.length === 0) {
          return [];
        }
        return this.getClientRects().toRectList();
      }

      const iterator = Util.createTextNodeIterator(commonAncestorContainer);
      let range = document.createRange();
      range.setStart(startContainer, startOffset);
      range.setEnd(startContainer, startContainer.length);
      let rectList = range.getClientRects().toRectList();

      let node;
      while ((node = iterator.nextNode())) {
        // startContainer 보다 node가 앞에 있으면
        if (startContainer.compareDocumentPosition(node) === DOCUMENT_POSITION_PRECEDING || startContainer === node) {
          continue;
        }

        // endContainer 뒤로 넘어가면 멈춤
        if (endContainer.compareDocumentPosition(node) === DOCUMENT_POSITION_FOLLOWING || endContainer === node) {
          break;
        }

        range = document.createRange();
        range.selectNodeContents(node);
        if (/^\s*$/.test(range.toString())) {
          continue;
        }

        rectList = rectList.concat(range.getClientRects().toRectList());
      }

      range = document.createRange();
      range.setStart(endContainer, 0);
      range.setEnd(endContainer, endOffset);
      if (!/^\s*$/.test(range.toString())) {
        rectList = rectList.concat(range.getClientRects().toRectList());
      }

      return rectList;
    });

    injectIfNeeded(Range.prototype, 'toSerializedString', function toSerializedString(root) {
      return rangy.serializeRange(this, true, root);
    });

    injectIfNeeded(Range, 'fromSerializedString', (string, root) => {
      const range = rangy.deserializeRange(string, root);
      const newRange = document.createRange();
      newRange.setStart(range.startContainer, range.startOffset);
      newRange.setEnd(range.endContainer, range.endOffset);
      range.detach();
      return newRange;
    });

    const rectCls = [];
    try { rectCls.push(DOMRect) } catch (e) {} // eslint-disable-line
    try { rectCls.push(ClientRect) } catch (e) {} // eslint-disable-line
    rectCls.forEach((cls) => {
      if (cls) {
        injectIfNeeded(cls.prototype, 'toRect', function toRect() {
          return new Rect(this);
        });
      }
    });

    const listCls = document.documentElement.getClientRects().constructor;
    injectIfNeeded(listCls.prototype, 'toRectList', function toRectList() {
      return new RectList(...RectList.from(this, rect => rect.toRect()));
    });
  }

  /**
   * @private
   */
  _setViewport() {
    const value = `width=${this.context.width}, height=${this.context.height},` +
      ' initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=0';
    let viewport = document.querySelector('meta[name=viewport]');
    if (viewport === null) {
      viewport = document.createElement('meta');
      viewport.id = 'viewport';
      viewport.name = 'viewport';
      document.getElementsByTagName('head')[0].appendChild(viewport);
    }
    viewport.content = value;
  }

  /**
   * @param {Rect|DOMRect|ClientRect} rect
   * @returns {Rect}
   */
  rectToAbsolute(rect) {
    if (!(rect instanceof Rect)) {
      rect = new Rect(rect);
    }
    const inset = { top: this.pageYOffset, left: this.pageXOffset };
    if (this.context.isScrollMode) {
      rect.top += inset.top;
    } else {
      rect.left += inset.left;
    }
    return rect;
  }

  /**
   * @param {RectList|DOMRectList|ClientRectList} rects
   * @returns {RectList}
   */
  rectsToAbsolute(rects) {
    if (!(rects instanceof RectList)) {
      rects = RectList.from(rects, rect => rect.toRect());
    }
    return rects.map(rect => this.rectToAbsolute(rect));
  }

  /**
   * @param {number} offset
   */
  scrollTo(offset) {
    if (this.context.isScrollMode) {
      window.scroll(0, offset);
    } else {
      window.scroll(offset, 0);
    }
  }

  /**
   * @param {string} keyword
   * @returns {?string} serializedRange
   */
  searchText(keyword) {
    if (window.find(keyword, 0)) { // Case insensitive
      const range = getSelection().getRangeAt(0);
      const target = range.startContainer;
      const { ref } =
        this.contents.find(content => content.ref.compareDocumentPosition(target) & DOCUMENT_POSITION_CONTAINED_BY);
      if (ref) {
        return range.toSerializedString(ref);
      }
    }
    return null;
  }

  /**
   * @param {number} pre
   * @param {number} post
   * @returns {string}
   */
  textAroundSearchResult(pre, post) {
    const range = getSelection().getRangeAt(0);
    const {
      startContainer,
      startOffset,
      endContainer,
      endOffset,
    } = range;

    const start = startOffset;
    const newStart = Math.max(startOffset - pre, 0);

    const end = endOffset;
    const newEnd = Math.min(newStart + post, endContainer.length);

    range.setStart(startContainer, newStart);
    range.setEnd(endContainer, newEnd);

    const result = range.toString();
    range.setStart(startContainer, start);
    range.setEnd(endContainer, end);

    return result;
  }

  /**
   * @returns {RectList}
   */
  getRectListOfSearchResult() {
    return getSelection()
      .getRangeAt(0)
      .getClientRects()
      .toRectList();
  }

  /**
   * @returns {number} zero-based page number
   */
  getPageOfSearchResult() {
    const range = getSelection().getRangeAt(0);
    return this.contents
      .find(content => content.ref.compareDocumentPosition(range.startContainer) & DOCUMENT_POSITION_CONTAINED_BY)
      .getPageFromRect(this.getRectListOfSearchResult()[0]);
  }
}
