import _Util from '../common/_Util';
import MutableClientRect from '../common/MutableClientRect';

export default class Util extends _Util {
  static getRectsFromSerializedRange(idx, serializedRange) {
    const range = this.getRangeFromSerializedRange(serializedRange);
    const rects = this.getOnlyTextNodeRectsFromRange(range);
    android.onRectsOfSerializedRange(idx, serializedRange, this.rectsToAbsoluteCoord(rects));
  }

  static adjustPoint(x, y) {
    const version = app.chromeMajorVersion;
    const point = { x, y };
    if (app.scrollMode) {
      return point;
    } else if (this.checkCurseInChrome()) {
      point.x += (app.pageWidthUnit * app.pageWeightForChrome);
      if (app.pageOverflowForChrome) {
        point.x -= app.getColumnGap() * CURSE;
      }
    } else if (version === 41 || version === 40) {
      point.x += window.pageXOffset;
    }
    return point;
  }

  static adjustRect(rect) {
    return this._rectToRelativeForChrome(rect);
  }

  static adjustRects(rects) {
    return this._rectsToRelativeForChrome(rects);
  }

  static _rectToRelativeForChromeInternal(rect, gap) {
    const adjustRect = new MutableClientRect(rect);
    if (!app.scrollMode) {
      const pageUnit = app.pageWidthUnit;
      const pageWeight = app.pageWeightForChrome;
      adjustRect.left -= (pageUnit * pageWeight);
      adjustRect.right -= (pageUnit * pageWeight);
      if (app.pageOverflowForChrome) {
        adjustRect.left += gap * CURSE;
        adjustRect.right += gap * CURSE;
      }
    }
    return adjustRect;
  }

  static _rectToRelativeForChrome(rect) {
    if (this.checkCurseInChrome()) {
      return this._rectToRelativeForChromeInternal(rect, app.getColumnGap());
    }
    return new MutableClientRect(rect);
  }

  static _rectsToRelativeForChrome(rects) {
    if (this.checkCurseInChrome()) {
      const gap = app.getColumnGap();
      const newRects = [];
      rects.forEach(rect => newRects.push(this._rectToRelativeForChromeInternal(rect, gap)));
      return newRects;
    }
    return rects;
  }

  static checkCurseInChrome(version = app.chromeMajorVersion) {
    return version === 47 || version >= 49;
  }
}

Util.staticOverride(Util, _Util, [
  '_rectToRelativeForChromeInternal',
  '_rectToRelativeForChrome',
  '_rectsToRelativeForChrome',
  'checkCurseInChrome',
  'adjustPoint',
  'adjustRect',
  'adjustRects'
]);
