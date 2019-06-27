/**
 * @class Rect
 */
export default class Rect {
  /**
   * @returns {boolean}
   */
  get isZero() { return this.left === 0 && this.top === 0 && this.right === 0 && this.bottom === 0; }

  /**
   * @returns {number}
   */
  get right() { return this.left + this.width; }

  /**
   * @returns {number}
   */
  get bottom() { return this.top + this.height; }

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
      this.left = rect.left || 0;
      this.top = rect.top || 0;
      this.width = rect.width || 0;
      this.height = rect.height || 0;
      this.x = rect.x || 0;
      this.y = rect.y || 0;
    } else {
      this.left = 0;
      this.top = 0;
      this.width = 0;
      this.height = 0;
      this.x = 0;
      this.y = 0;
    }
  }

  /**
   * @param {DOMRect|ClientRect|Rect|object} rect
   * @returns {boolean}
   */
  equals(rect) {
    return this.left === (rect.left || 0) &&
      this.top === (rect.top || 0) &&
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
   * Reader가 생성될 때 구현
   *
   * @returns {Rect}
   */
  toAbsolute() {
    return null;
  }

  /**
   * @returns {string}
   */
  toCoord() {
    return `${this.left},${this.top},${this.width},${this.height},`;
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
