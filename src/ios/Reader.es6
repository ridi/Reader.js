import _Reader from '../common/_Reader';
import Content from './Content';
import Sel from './Sel';
import Handler from './Handler';

export default class Reader extends _Reader {
  /**
   * @returns {Boolean}
   */
  get isBackground() { return this._appInBackground; }

  /**
   * @param {HTMLElement} wrapper
   * @param {Context} context
   */
  constructor(wrapper, context) {
    super(wrapper, context);
    this._appInBackground = false;
    this._content = new Content(wrapper);
    this._handler = new Handler(this);
    this._sel = new Sel(this);
  }

  injectMethod() {
    super.injectMethod();

    /* eslint-disable no-console */
    console.log = (log => (message) => {
      log.call(console, message);
      window.location.href = `ridi+epub://invocation/log?${encodeURIComponent(message)}`;
    })(console.log);
    /* eslint-enable no-console */
  }

  didEnterBackground() {
    this._appInBackground = true;
  }

  didEnterForeground() {
    this._appInBackground = false;
  }

  /**
   * @param {Number} offset
   */
  scrollTo(offset = 0) {
    // offset이 maxOffset을 넘길 수 없도록 보정한다. 이게 필요한 이유는 아래와 같다.
    // - 보기 설정 미리보기를 보여주는 중에 마지막 페이지보다 뒤로 이동해 빈 페이지가 보이는 것을 방지
    let adjustOffset = offset;
    if (this.context.isScrollMode) {
      const height = this.context.pageHeightUnit;
      const maxOffset = this.totalHeight - height;
      adjustOffset = Math.min(adjustOffset, maxOffset);
    } else {
      const width = this.context.pageWidthUnit;
      const maxPage = Math.max(Math.ceil(this.totalWidth / width) - 1, 0);
      adjustOffset = Math.min(adjustOffset, maxPage * width);
    }

    super.scrollTo(adjustOffset);
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
    const pageUnit = direction === 'left' ? this.context.pageWidthUnit : this.context.pageHeightUnit;
    let page = Math.floor((rect[direction] + this.pageOffset) / pageUnit);

    if (!this.context.isScrollMode && rect.top < 0) {
      page += Math.floor(rect.top / this.context.pageHeightUnit);
    }
    return page;
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

    // 앱이 백그라운드 상태일 때는 계산하지 않는다.
    // (백그라운드 상태에서는 scrollLeft 값을 신뢰할 수 없기 때문)
    if (this.isBackground) {
      return notFound;
    }

    const location = this.findNodeLocation(startOffset, endOffset, type, posSeparator);
    this.showNodeLocationIfNeeded();
    if (!location) {
      return notFound;
    }

    return location;
  }

  /**
   * @param {Number} width
   * @param {Number} height
   * @param {Number} gap
   * @param {String} style
   * @param {Number} fontSize
   */
  changePageSizeWithStyle(width, height, gap, style, fontSize) {
    const prevPage = this.curPage;

    this.changeContext(Object.assign(this.context, { _width: width, _height: height, _gap: gap }));

    const styleElements = document.getElementsByTagName('style');
    const styleElement = styleElements[styleElements.length - 1];
    styleElement.innerHTML = style;

    const bodyStyle = this.content.body.style;
    bodyStyle['font-size'] = `${fontSize}%`;

    this.scrollTo(prevPage * this.context.pageUnit);

    this.setViewport();
  }
}
