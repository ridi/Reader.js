import _Object from './_Object';

export default class Chrome extends _Object {
  /**
   * @returns {Number}
   */
  get version() { return this._version; }

  /**
   * @returns {Boolean}
   */
  get isCursed() {
    return this.isAndroid && (this.version === 47 || (this.version >= 49 && this.version < 61));
  }

  /**
   * @returns {Boolean}
   */
  get isAndroid() {
    return (navigator.userAgent || '').match(/android/gi) !== null;
  }

  /**
   * @returns {Number}
   */
  get pageWeight() { return this._pageWeight; }

  /**
   * @param {Number} pageWeight
   */
  set pageWeight(pageWeight) { this._pageWeight = pageWeight; }

  /**
   * @returns {Boolean}
   */
  get pageOverflow() { return this._pageOverflow; }

  /**
   * @param {Boolean} pageOverflow
   */
  set pageOverflow(pageOverflow) { this._pageOverflow = pageOverflow; }

  /**
   * @returns {Number}
   */
  get prevPage() { return this._prevPage; }

  /**
   * @param {Number} prevPage
   */
  set prevPage(prevPage) { this._prevPage = prevPage; }

  /**
   * @param {Reader} reader
   * @param {Number} curPage
   */
  constructor(reader, curPage = 0) {
    super();
    const chrome = ((navigator.userAgent || '').match(/chrome\/[\d]+/gi) || [''])[0];
    const version = parseInt((chrome.match(/[\d]+/g) || [''])[0], 10);
    if (!isNaN(version)) {
      this._version = version;
    }
    this._magic = 3; // Chrome 47, 49~60 대응용 매직넘버.
    this.changedPage(curPage);
    this._scrollTracked = false;
    this._scrollListener = () => {
      if (!this.isCursed || reader.context.isScrollMode) {
        return;
      }
      // * Chrome 47, 49~60 대응
      // viewport의 범위와 curPage의 clientLeft 기준이 변경됨에 따라 아래와 같이 대응함. (normalizePoint, normalizeRect 참고)
      // - 페이지 이동에 따라 0~3의 가중치(pageWeight)를 부여.
      // - rect.left 또는 touchPointX에 'pageWeight * pageUnit' 값을 빼거나 더함.
      // - 가중치가 3에 도달한 후 0이 되기 전까지는 'pageGap * 3' 값을 더하거나 뺌.
      const page = reader.curPage;
      const { prevPage, pageOverflow } = this;
      let { pageWeight } = this;
      if (page > prevPage) { // next
        pageWeight = Math.min(pageWeight + (page - prevPage), this._magic);
        if (!pageOverflow) {
          this.pageOverflow = pageWeight === this._magic;
        }
      } else if (page < prevPage) { // prev
        pageWeight = Math.max(pageWeight - (prevPage - page), 0);
        if (pageWeight === 0) {
          this.pageOverflow = false;
        }
      }
      this.prevPage = page;
      this.pageWeight = pageWeight;
    };
    this._reader = reader;
  }

  /**
   * @param {Number} page
   */
  changedPage(page) {
    this.pageWeight = Math.min(page, this._magic);
    this.pageOverflow = this.pageWeight === this._magic;
    this.prevPage = page;
  }

  addScrollListenerIfNeeded() {
    if (!this._scrollTracked) {
      this._scrollTracked = true;
      window.addEventListener('scroll', this._scrollListener, true);
    }
  }

  removeScrollListenerIfNeeded() {
    if (this._scrollTracked) {
      this._scrollTracked = false;
      window.removeEventListener('scroll', this._scrollListener, true);
    }
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {{x: Number, y: Number}}
   */
  normalizePoint(x, y) {
    const point = { x, y };
    const { htmlClientWidth, bodyClientWidth, pageXOffset, context } = this._reader;
    if (context.isScrollMode) {
      return point;
    } else if (this.isCursed) {
      point.x += (context.pageWidthUnit * this.pageWeight);
      if (this.pageOverflow) {
        point.x -= context.pageGap * this._magic;
        if (htmlClientWidth - bodyClientWidth === 1) {
          point.x += this._magic;
        }
      }
    } else if (this.version === 41 || this.version === 40) {
      point.x += pageXOffset;
    }
    return point;
  }

  /**
   * @param {Rect} rect
   * @returns {Rect}
   */
  normalizeRect(rect) {
    /* eslint-disable no-param-reassign */
    const { htmlClientWidth, bodyClientWidth, context } = this._reader;
    if (this.isCursed && !context.isScrollMode) {
      rect.left -= (context.pageWidthUnit * this.pageWeight);
      rect.right -= (context.pageWidthUnit * this.pageWeight);
      if (this._pageOverflow) {
        rect.left += context.pageGap * this._magic;
        rect.right += context.pageGap * this._magic;
        if (htmlClientWidth - bodyClientWidth === 1) {
          rect.left -= this._magic;
          rect.right -= this._magic;
        }
      }
    }
    /* eslint-enable no-param-reassign */
    return rect;
  }
}
