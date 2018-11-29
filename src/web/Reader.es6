import _Reader from '../common/_Reader';
import Content from './Content';
import Chrome from '../common/Chrome';
import Sel from './Sel';

export default class Reader extends _Reader {
  /**
   * @returns {Chrome}
   */
  get chrome() { return this._chrome; }

  /**
   * @returns {Number}
   */
  get htmlClientWidth() { return document.documentElement.clientWidth; }

  /**
   * @returns {Number}
   */
  get bodyClientWidth() { return this.content.wrapper.clientWidth; }

  /**
   * @param {HTMLElement} wrapper
   * @param {Context} context
   * @param {Number} curPage (zero-base)
   */
  constructor(wrapper, context, curPage = 0) {
    super(wrapper, context);
    this._content = new Content(this, wrapper);
    const chrome = new Chrome(this, curPage);
    if (chrome.version) {
      this._chrome = chrome;
      this.chrome.addScrollListenerIfNeeded();
    }
    this._sel = new Sel(this);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {{x: Number, y: Number}}
   */
  normalizePoint(x, y) {
    if (this.chrome) {
      return this.chrome.normalizePoint(x, y);
    }
    return super.normalizePoint(x, y);
  }

  /**
   * @param {Rect} rect
   * @returns {Rect}
   */
  normalizeRect(rect) {
    if (this.chrome) {
      return this.chrome.normalizeRect(rect);
    }
    return super.normalizeRect(rect);
  }

  setViewport() {
    // 웹은 앱과 달리 콘텐츠(HTML)를 그대로 로드하는게 아니라 한번 감싸고 있기 때문에 viewport를 관여해선 안된다.
  }

  unmount() {
    if (this.chrome) {
      this.chrome.removeScrollListenerIfNeeded();
    }
  }

  /**
   * @param {Rect} rect
   * @param {Node} el
   * @returns {Number|null} (zero-base)
   */
  getPageFromRect(rect, el) {
    if (rect === null) {
      return null;
    }

    const direction = this.getOffsetDirectionFromElement(el);
    const origin = rect[direction] + this.pageOffset;
    const pageUnit = direction === 'left' ? this.context.pageWidthUnit : this.context.pageHeightUnit;
    return Math.floor(origin / pageUnit);
  }

  /**
   * @param {String} type (top or bottom)
   * @param {String} posSeparator
   * @returns {String}
   */
  getNodeLocationOfCurrentPage(type = 'top', posSeparator = '#') {
    const startOffset = 0;
    const endOffset = this.context.pageUnit;
    const notFound = `-1${posSeparator}-1`;

    const location = this.findNodeLocation(startOffset, endOffset, type, posSeparator);
    this.showNodeLocationIfNeeded();
    if (!location) {
      return notFound;
    }

    return location;
  }
}
