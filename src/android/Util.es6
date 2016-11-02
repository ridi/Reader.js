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
      const gap = app.getColumnGap();
      const curPage = app.getCurPage();
      const pageUnit = app.pageWidthUnit;
      const pageWeight = app.pageWeightForChrome;
      if (curPage < CURSE || app.pageOverflowForChrome) {
        point.x += (pageUnit * pageWeight);
      } else {
        point.x += ((pageUnit - gap) * pageWeight);
        if (pageWeight > 0 && pageWeight < CURSE) {
          point.x -= (gap * (CURSE - pageWeight));
        }
      }
    } else if (version <= 41 && version >= 40) {
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

  static _rectToRelativeForChromeInternal(rect, gap, curPage) {
    const adjustRect = new MutableClientRect(rect);
    const pageUnit = app.pageWidthUnit;
    const pageWeight = app.pageWeightForChrome;
    if (curPage < CURSE || app.pageOverflowForChrome) {
      adjustRect.left -= (pageUnit * pageWeight);
      adjustRect.right -= (pageUnit * pageWeight);
      return adjustRect;
    }
    adjustRect.left -= ((pageUnit - gap) * pageWeight);
    adjustRect.right -= ((pageUnit - gap) * pageWeight);
    if (pageWeight > 0 && pageWeight < CURSE) {
      adjustRect.left += (gap * (CURSE - pageWeight));
      adjustRect.right += (gap * (CURSE - pageWeight));
    }
    return adjustRect;
  }

  static _rectToRelativeForChrome(rect) {
    if (this.checkCurseInChrome() && !app.scrollMode) {
      return this._rectToRelativeForChromeInternal(rect, app.getColumnGap(), app.getCurPage());
    }
    return new MutableClientRect(rect);
  }

  static _rectsToRelativeForChrome(rects) {
    if (this.checkCurseInChrome() && !app.scrollMode) {
      const gap = app.getColumnGap();
      const curPage = app.getCurPage();
      const newRects = [];
      for (let i = 0; i < rects.length; i++) {
        newRects.push(this._rectToRelativeForChromeInternal(rects[i], gap, curPage));
      }
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
