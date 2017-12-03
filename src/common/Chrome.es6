import _Object from './_Object';
import MutableClientRect from './MutableClientRect';

export default class Chrome extends _Object {
  /**
   * @returns {Number}
   */
  get version() { return this._version; }

  /**
   * @returns {Boolean}
   */
  get isCursed() {
    return this.version === 47 || (this.version >= 49 && this.version < 61);
  }

  /**
   * @param {Reader} reader
   * @param {Number} curPage
   */
  constructor(reader, curPage) {
    super();
    const chrome = ((navigator.userAgent || '').match(/chrome\/[\d]+/gi) || [''])[0];
    const version = parseInt((chrome.match(/[\d]+/g) || [''])[0], 10);
    if (!isNaN(version)) {
      this._version = version;
    }
    this._magic = 3; // Chrome 47, 49~60 대응용 매직넘버.
    this._pageWeight = Math.min(curPage, this._magic);
    this._pageOverflow = this._pageWeight === this._magic;
    this._prevPage = curPage;
    this._scrollTracked = false;
    this._scrollListener = () => {
      if (!this.isCursed || reader.context.isScrollMode) {
        return;
      }
      // * Chrome 47, 49~60 대응
      // viewport의 범위와 curPage의 clientLeft 기준이 변경됨에 따라 아래와 같이 대응함. (adjustPoint, adjustRect 참고)
      // - 페이지 이동에 따라 0~3의 가중치(pageWeight)를 부여.
      // - rect.left 또는 touchPointX에 'pageWeight * pageUnit' 값을 빼거나 더함.
      // - 가중치가 3에 도달한 후 0이 되기 전까지는 'pageGap * 3' 값을 더하거나 뺌.
      const page = reader.curPage;
      let pageWeight = this._pageWeight;
      if (page > this._prevPage) { // next
        pageWeight = Math.min(pageWeight + (page - this._prevPage), this._magic);
        if (!this._pageOverflow) {
          this._pageOverflow = pageWeight === this._magic;
        }
      } else if (page < this._prevPage) { // prev
        pageWeight = Math.max(pageWeight - (this._prevPage - page), 0);
        if (pageWeight === 0) {
          this._pageOverflow = false;
        }
      }
      this._prevPage = page;
      this._pageWeight = pageWeight;
    };
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
   * @param {Reader} reader
   * @param {Number} x
   * @param {Number} y
   * @returns {{x: Number, y: Number}}
   */
  adjustPoint(reader, x, y) {
    const point = { x, y };
    const { htmlClientWidth, bodyClientWidth, pageXOffset, context } = reader;
    if (context.isScrollMode) {
      return point;
    } else if (this.isCursed) {
      point.x += (context.pageWidthUnit * this._pageWeight);
      if (this._pageOverflow) {
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
   * @param {Reader} reader
   * @param {ClientRect} rect
   * @returns {MutableClientRect}
   */
  adjustRect(reader, rect) {
    const { htmlClientWidth, bodyClientWidth, context } = reader;
    const adjustRect = new MutableClientRect(rect);
    if (this.isCursed && !context.isScrollMode) {
      adjustRect.left -= (context.pageWidthUnit * this._pageWeight);
      adjustRect.right -= (context.pageWidthUnit * this._pageWeight);
      if (this._pageOverflow) {
        adjustRect.left += context.pageGap * this._magic;
        adjustRect.right += context.pageGap * this._magic;
        if (htmlClientWidth - bodyClientWidth === 1) {
          adjustRect.left -= this._magic;
          adjustRect.right -= this._magic;
        }
      }
    }
    return adjustRect;
  }
}
