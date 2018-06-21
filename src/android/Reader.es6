import _Reader from '../common/_Reader';
import Content from './Content';
import Chrome from '../common/Chrome';
import Handler from './Handler';
import Sel from './Sel';
import Util from './Util';

export default class Reader extends _Reader {
  /**
   * @returns {Chrome}
   */
  get chrome() { return this._chrome; }

  /**
   * @returns {Number}
   */
  get htmlClientWidth() { return this._htmlClientWidth; }

  /**
   * @returns {Number}
   */
  get bodyClientWidth() { return this._bodyClientWidth; }

  /**
   * @param {HTMLElement} wrapper
   * @param {Context} context
   * @param {Number} curPage (zero-base)
   * @param {String} contentSrc
   */
  constructor(wrapper, context, curPage, contentSrc) {
    super(wrapper, context);

    this._content = new Content(wrapper, contentSrc);
    this._handler = new Handler(this);
    this._sel = new Sel(this);
    this._chrome = new Chrome(this, curPage);
    this.chrome.addScrollListenerIfNeeded();
    this.calcPageForDoublePageMode = false;
    this._updateClientWidth();
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {{x: Number, y: Number}}
   */
  adjustPoint(x, y) {
    return this.chrome.adjustPoint(this, x, y);
  }

  /**
   * @param {ClientRect} rect
   * @returns {MutableClientRect}
   */
  adjustRect(rect) {
    return this.chrome.adjustRect(this, rect);
  }

  /**
   * @param {Context} context
   * @param {Number} curPage (zero-base)
   */
  changeContext(context, curPage) {
    super.changeContext(context);
    if (this.chrome.isCursed) {
      this.chrome.removeScrollListenerIfNeeded();
      this._chrome = new Chrome(this, curPage);
      this.chrome.addScrollListenerIfNeeded();
    }
  }

  /**
   * @param {Number} currentTime
   * @param {Number} start
   * @param {Number} change
   * @param {Number} duration
   * @returns {Number}
   * @private
   */
  _easeInOut(currentTime, start, change, duration) {
    let time = currentTime;
    time /= duration / 2;
    if (time < 1) {
      return (((change / 2) * time) * time) + start;
    }
    time -= 1;
    return ((-change / 2) * ((time * (time - 2)) - 1)) + start;
  }

  /**
   * @param {Number} offset
   * @param {Boolean} animated
   */
  scrollTo(offset = 0, animated = false) {
    // offset이 maxOffset을 넘길 수 없도록 보정한다. 이게 필요한 이유는 아래와 같다.
    // - 스크롤 보기에서 잘못해서 paddingBottom 영역으로 이동해 다음 스파인으로 이동되는 것을 방지
    // - 보기 설정 미리보기를 보여주는 중에 마지막 페이지보다 뒤로 이동해 빈 페이지가 보이는 것을 방지
    // 네이티브에서 보정하지 않는 것은 WebView.getContentHeight 값을 신뢰할 수 없기 때문이다.
    let adjustOffset = offset;
    const { body } = this.content;
    if (this.context.isScrollMode) {
      const height = this.context.pageHeightUnit;
      const paddingTop = Util.getStylePropertyIntValue(body, 'padding-top');
      const paddingBottom = Util.getStylePropertyIntValue(body, 'padding-bottom');
      const maxOffset = this.totalHeight - height - paddingBottom;
      const diff = maxOffset - adjustOffset;
      if (adjustOffset > paddingTop && diff < height && diff > 0) {
        adjustOffset = maxOffset;
      }
      adjustOffset = Math.min(adjustOffset, maxOffset);
    } else {
      const width = this.context.pageWidthUnit;
      const height = this.context.pageHeightUnit;
      const marginBottom = Util.getStylePropertyIntValue(body, 'margin-bottom');
      const extraPages = marginBottom / (this.context.isDoublePageMode ? height * 2 : height);
      const maxPage = Math.max(Math.ceil(this.totalWidth / width) - extraPages, 0);
      adjustOffset = Math.min(adjustOffset, maxPage * width);
    }

    if (animated) {
      if (this._scrollTimer) {
        clearTimeout(this._scrollTimer);
        this._scrollTimer = null;
      }

      const start = this.context.isScrollMode ? this.pageYOffset : this.pageXOffset;
      const change = adjustOffset - start;
      const increment = 20;
      const duration = 200;
      const animateScroll = (elapsedTime) => {
        const time = elapsedTime + increment;
        super.scrollTo(this._easeInOut(time, start, change, duration));
        if (time < duration) {
          this._scrollTimer = setTimeout(() => {
            animateScroll(time);
          }, increment);
        } else {
          this._scrollTimer = null;
        }
      };

      animateScroll(0);
    } else {
      super.scrollTo(adjustOffset);
    }
  }

  /**
   * @returns {Number}, -1은 재요청이 필요함을 의미
   */
  calcPageCount() {
    if (document.fonts && document.fonts.status) {
      if (document.fonts.status !== 'loaded') {
        return -1;
      }
    }

    if (this.context.isScrollMode) {
      return Math.round(this.totalHeight / this.context.pageHeightUnit);
    }

    const columnWidth = this.context.pageWidthUnit - this.context.pageGap;
    if (this.totalWidth < columnWidth) {
      // 가끔 total width가 0으로 넘어오는 경우가 있다. (커버 페이지에서 이미지가 그려지기 전에 호출된다거나)
      // 젤리빈에서는 0이 아닌 getWidth()보다 작은 값이 나오는 경우가 확인되었으며 재요청시 정상값 들어옴.
      return -1;
    }

    const version = this.context.chromeMajorVersion;
    if (version >= 45 && version < 60) {
      // Chrome 45 버전부터 epub.totalWidth() 값을 신뢰할 수 없게 되어 다단으로 나뉘어진 body의 높이로 페이지를 계산한다.
      const bodyHeight = parseFloat(window.getComputedStyle(this.content.body).height, 10);
      let pageCount = bodyHeight / this.context.pageHeightUnit;
      if (this.context.isDoublePageMode) {
        pageCount /= 2;
      }
      return Math.max(Math.ceil(pageCount), 1);
    }
    return Math.ceil(this.totalWidth / this.context.pageWidthUnit);
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
    const offset = origin / pageUnit;
    const fOffset = Math.floor(offset);
    if (this.calcPageForDoublePageMode) {
      const rOffset = Math.round(offset);
      if (fOffset === rOffset) {
        return fOffset;
      }
      return rOffset - 0.5;
    }
    return fOffset;
  }

  /**
   * @param {Number} index
   * @param {String} serializedRange
   */
  getRectsFromSerializedRange(index, serializedRange) {
    const rects = super.getRectsFromSerializedRange(serializedRange);
    android.onRectsOfSerializedRange(index, serializedRange, this.rectsToAbsoluteCoord(rects));
  }

  /**
   * @param {String} type (top or bottom)
   * @param {String} posSeparator
   */
  getNodeLocationOfCurrentPage(type = 'top', posSeparator = '#') {
    const startOffset = 0;
    const endOffset = this.context.pageUnit;

    const location = this.findNodeLocation(startOffset, endOffset, type, posSeparator);
    this.showNodeLocationIfNeeded();
    if (!location) {
      android.onNodeLocationOfCurrentPageNotFound();
      return;
    }

    android.onNodeLocationOfCurrentPageFound(location);
  }

  /**
   * @param {Number} width
   * @param {Number} gap
   */
  applyColumnProperty(width, gap) {
    this.content.wrapper.setAttribute('style',
      `-webkit-column-width: ${width}px !important; ` +
      `-webkit-column-gap: ${gap}px !important;`);
    let style = (this.content.body.attributes.style || { nodeValue: '' }).nodeValue;
    const originStyle = style;
    style += 'margin-top: -1px !important;';
    this.content.body.setAttribute('style', style);
    setTimeout(() => {
      this.content.body.setAttribute('style', originStyle);
      this._updateClientWidth();
    }, 0);
  }

  /**
   * @param {Number} width
   * @param {Number} height
   * @param {Number} gap
   * @param {String} style
   */
  changePageSizeWithStyle(width, height, gap, style) {
    const prevPage = this.curPage;

    this.changeContext(Object.assign(this.context, { _width: width, _height: height, _gap: gap }));

    const styleElements = document.getElementsByTagName('style');
    const styleElement = styleElements[styleElements.length - 1];
    styleElement.innerHTML = style;
    this.scrollTo(prevPage * this.context.pageUnit);

    this.setViewport();
    this._updateClientWidth();
  }

  _updateClientWidth() {
    this._htmlClientWidth = this.content.wrapper.clientWidth;
    this._bodyClientWidth = this.content.body.clientWidth;
  }

  /**
   * @param {*} args
   * @private
   */
  _moveTo(...args) {
    const method = args[0];
    if (this.context.isScrollMode) {
      const scrollY = this[`getOffsetFrom${method}`](args[1]);
      if (scrollY !== null) {
        android[`onScrollYOffsetOf${method}Found`](android.dipToPixel(scrollY));
        return;
      }
    } else {
      const page = this[`getOffsetFrom${method}`](args[1]);
      if (page !== null) {
        android[`onPageOffsetOf${method}Found`](page);
        return;
      }
    }
    android[`on${method}NotFound`]();
  }

  /**
   * @param {string} anchor
   */
  moveToAnchor(anchor) {
    this._moveTo('Anchor', anchor);
  }

  /**
   * @param {string} serializedRange
   */
  moveToSerializedRange(serializedRange) {
    this._moveTo('SerializedRange', serializedRange);
  }

  /**
   * @param {string} location
   */
  moveToNodeLocation(location) {
    this._moveTo('NodeLocation', location);
  }
}
