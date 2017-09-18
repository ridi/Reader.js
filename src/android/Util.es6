import _Util from '../common/_Util';
import MutableClientRect from '../common/MutableClientRect';

export default class Util extends _Util {
  /**
   * @param {number} idx
   * @param {string} serializedRange
   */
  static getRectsFromSerializedRange(idx, serializedRange) {
    const range = this.getRangeFromSerializedRange(serializedRange);
    const rects = this.getOnlyTextNodeRectsFromRange(range);
    android.onRectsOfSerializedRange(idx, serializedRange, this.rectsToAbsoluteCoord(rects));
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {{x: number, y: number}}
   */
  static adjustPoint(x, y) {
    const version = app.chromeMajorVersion;
    const point = { x, y };
    if (app.scrollMode) {
      return point;
    } else if (this.checkCurseInChrome()) {
      point.x += (app.pageWidthUnit * app.pageWeightForChrome);
      if (app.pageOverflowForChrome) {
        point.x -= app.columnGap * CURSE;
        if (app.htmlClientWidth - app.bodyClientWidth === 1) {
          point.x += CURSE;
        }
      }
    } else if (version === 41 || version === 40) {
      point.x += window.pageXOffset;
    }
    return point;
  }

  /**
   * @param {ClientRect} rect
   * @returns {MutableClientRect}
   */
  static adjustRect(rect) {
    return this._rectToRelativeForChrome(rect);
  }

  /**
   * @param {[ClientRect]} rects
   * @returns {[MutableClientRect]}
   */
  static adjustRects(rects) {
    return this._rectsToRelativeForChrome(rects);
  }

  /**
   * @param {ClientRect} rect
   * @returns {MutableClientRect}
   * @private
   */
  static _rectToRelativeForChromeInternal(rect) {
    const adjustRect = new MutableClientRect(rect);
    if (!app.scrollMode) {
      const gap = app.columnGap;
      const pageUnit = app.pageWidthUnit;
      const pageWeight = app.pageWeightForChrome;
      adjustRect.left -= (pageUnit * pageWeight);
      adjustRect.right -= (pageUnit * pageWeight);
      if (app.pageOverflowForChrome) {
        adjustRect.left += gap * CURSE;
        adjustRect.right += gap * CURSE;
        if (app.htmlClientWidth - app.bodyClientWidth === 1) {
          adjustRect.left -= CURSE;
          adjustRect.right -= CURSE;
        }
      }
    }
    return adjustRect;
  }

  /**
   * @param {ClientRect} rect
   * @returns {MutableClientRect}
   * @private
   */
  static _rectToRelativeForChrome(rect) {
    if (this.checkCurseInChrome()) {
      return this._rectToRelativeForChromeInternal(rect);
    }
    return new MutableClientRect(rect);
  }

  /**
   * @param {[ClientRect]} rects
   * @returns {[MutableClientRect]}
   * @private
   */
  static _rectsToRelativeForChrome(rects) {
    if (this.checkCurseInChrome()) {
      const newRects = [];
      rects.forEach(rect => newRects.push(this._rectToRelativeForChromeInternal(rect)));
      return newRects;
    }
    return rects;
  }

  /**
   * @param {number} version
   * @returns {boolean}
   */
  static checkCurseInChrome(version = app.chromeMajorVersion) {
    return version === 47 || (version >= 49 && version < 61);
  }
}

Util.staticOverride(Util, _Util, [
  '_rectToRelativeForChromeInternal',
  '_rectToRelativeForChrome',
  '_rectsToRelativeForChrome',
  'checkCurseInChrome',
  'adjustPoint',
  'adjustRect',
  'adjustRects',
]);
