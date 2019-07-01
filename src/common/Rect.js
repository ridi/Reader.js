/**
 * @class Rect
 */
export default class Rect {
  /**
   * @returns {boolean}
   */
  get isZero() { return this.left === 0 && this.top === 0 && this.width === 0 && this.height === 0; }

  /**
   * @returns {number}
   */
  get left() { return this._left; }

  /**
   * @param {number} newLeft
   */
  set left(newLeft) {
    this.width = Math.max(this.right - newLeft, 0);
    this._left = newLeft;
  }

  /**
   * @returns {number}
   */
  get right() { return this.left + this.width; }

  /**
   * @param {number} newRight
   */
  set right(newRight) {
    this.width = Math.max(newRight - this.left, 0);
  }

  /**
   * @returns {number}
   */
  get top() { return this._top; }

  /**
   * @param {number} newTop
   */
  set top(newTop) {
    this.height = Math.max(this.bottom - newTop, 0);
    this._top = newTop;
  }

  /**
   * @returns {number}
   */
  get bottom() { return this.top + this.height; }

  /**
   * @param {number} newBottom
   */
  set bottom(newBottom) {
    this.height = Math.max(newBottom - this.top, 0);
  }

  /**
   * @returns {number}
   */
  get x() { return this.left; }

  /**
   * @param {number} newX
   */
  set x(newX) {
    this.left = newX;
  }

  /**
   * @returns {number}
   */
  get minX() { return this.left; }

  /**
   * @returns {number}
   */
  get midX() { return this.left + (this.width / 2); }

  /**
   * @returns {number}
   */
  get maxX() { return this.left + this.width; }

  /**
   * @returns {number}
   */
  get y() { return this.top; }

  /**
   * @param {number} newY
   */
  set y(newY) {
    this.top = newY;
  }

  /**
   * @returns {number}
   */
  get minY() { return this.top; }

  /**
   * @returns {number}
   */
  get midY() { return this.top + (this.height / 2); }

  /**
   * @returns {number}
   */
  get maxY() { return this.top + this.height; }

  /**
   * @param {?DOMRect|?ClientRect|?Rect|?object} rect
   */
  constructor(rect) {
    if (rect) {
      this.left = rect.left || rect.x || 0;
      this.top = rect.top || rect.y || 0;
      this.width = rect.width || 0;
      this.height = rect.height || 0;
    } else {
      this.left = 0;
      this.top = 0;
      this.width = 0;
      this.height = 0;
    }
  }

  /**
   * @param {DOMRect|ClientRect|Rect|object} rect
   * @returns {boolean}
   */
  equals(rect) {
    return this.left === (rect.left || rect.x || 0) &&
      this.top === (rect.top || rect.y || 0) &&
      this.width === (rect.width || 0) &&
      this.height === (rect.height || 0);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  contains(x, y) {
    return this.left <= x && x <= this.right && this.top <= y && y <= this.bottom;
  }

  /**
   * @param {number} width
   * @param {number} height
   * @returns {Rect}
   */
  inset(width = 0, height = 0) {
    this.left -= width / 2;
    this.right += width / 2;
    this.top -= height / 2;
    this.bottom += height / 2;
    return this;
  }

  /**
   * Reader가 생성될 때 구현부가 정해진다.
   *
   * @returns {Rect}
   */
  toAbsolute() {
    return null;
  }

  /**
   * @returns {string}
   */
  toJsonString() {
    return JSON.stringify(this.toObject());
  }

  /**
   * @returns {object}
   */
  toObject() {
    return {
      left: this.left,
      top: this.top,
      right: this.right,
      bottom: this.bottom,
      width: this.width,
      height: this.height,
      x: this.x,
      y: this.y,
    };
  }
}
