import Util from '../common/Util';
import MutableClientRect from '../common/MutableClientRect';

export default class RidiUtil extends Util {
  static getRectsFromSerializedRange(idx, serializedRange) {
    const range = this.getRangeFromSerializedRange(serializedRange);
    const rects = this.getOnlyTextNodeRectsFromRange(range);
    android.onRectsOfSerializedRange(idx, serializedRange, this.rectsToAbsoluteCoord(rects));
  }

  static adjustPoint(x, y) {
    return { x: this._offsetToAbsoluteForChrome(x), y };
  }

  static adjustRect(rect) {
    return this._rectToRelativeForChrome(rect);
  }

  static adjustRects(rects) {
    return this._rectsToRelativeForChrome(rects);
  }

  static _offsetToAbsoluteForChrome(offset) {
    let adjustOffset = offset;
    if (this.checkCurseInChrome() && !app.scrollMode) {
      const gap = app.getColumnGap();
      const curPage = app.getCurPage();
      const pageUnit = app.pageWidthUnit;
      const pageWeight = app.pageWeightForChrome;
      if (curPage < CURSE || app.pageOverflowForChrome) {
        adjustOffset += (pageUnit * pageWeight);
      } else {
        adjustOffset += ((pageUnit - gap) * pageWeight);
        if (pageWeight > 0 && pageWeight < CURSE) {
          adjustOffset -= (gap * (CURSE - pageWeight));
        }
      }
    }
    return adjustOffset;
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
    return rect;
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
