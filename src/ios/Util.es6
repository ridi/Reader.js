import _Util from '../common/_Util';
import MutableClientRect from '../common/MutableClientRect';

export default class Util extends _Util {
  /**
   * @param {string} serializedRange
   * @returns {[MutableClientRect]}
   */
  static getRectsFromSerializedRange(serializedRange) {
    const range = this.getRangeFromSerializedRange(serializedRange);
    const rects = this.getOnlyTextNodeRectsFromRange(range);
    return this.rectsToAbsoluteCoord(rects);
  }

  /**
   * @param {ClientRect} rect
   * @returns {MutableClientRect}
   */
  static adjustRect(rect) {
    return this._rectToRelative(rect);
  }

  /**
   * @param {[ClientRect]} rects
   * @returns {[MutableClientRect]}
   */
  static adjustRects(rects) {
    return this._rectsToRelative(rects);
  }

  /**
   * @param {ClientRect} rect
   * @returns {MutableClientRect}
   * @private
   */
  static _rectToRelative(rect) {
    const adjustRect = new MutableClientRect(rect);
    if (app.systemMajorVersion === 7) {
      if (app.scrollMode) {
        adjustRect.top -= window.pageYOffset;
      } else {
        adjustRect.left -= window.pageXOffset;
      }
    }
    return adjustRect;
  }

  /**
   * @param {[ClientRect]} rects
   * @returns {[MutableClientRect]}
   * @private
   */
  static _rectsToRelative(rects) {
    const newRects = [];
    for (let i = 0; i < rects.length; i++) {
      newRects.push(this._rectToRelative(rects[i]));
    }
    return newRects;
  }
}

/* eslint-disable no-console */
console.log = (log => (message) => {
  log.call(console, message);
  location.href = `ridi+epub://invocation/log?${encodeURIComponent(message)}`;
})(console.log);

Util.staticOverride(Util, _Util, [
  '_rectToRelative',
  '_rectsToRelative',
  'adjustRect',
  'adjustRects',
]);
