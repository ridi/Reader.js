import _Reader from '../common/_Reader';
import Content from './Content';

export default class Reader extends _Reader {
  /**
   * @param {HTMLElement} wrapper
   * @param {Context} context
   */
  constructor(wrapper, context) {
    super(wrapper, context);
    this._content = new Content(wrapper);
  }

  setViewport() {
    // 웹은 앱과 달리 콘텐츠(HTML)를 그대로 로드하는게 아니라 한번 감싸고 있기 때문에 viewport를 관여해선 안된다.
  }

  /**
   * @param {MutableClientRect} rect
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
