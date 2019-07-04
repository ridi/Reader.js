/**
 * @class Rect
 */
export default class Rect {
  /**
   * @returns {boolean}
   */
  get isZero() { return this.left === 0 && this.top === 0 && this.right === 0 && this.bottom === 0; }

  /**
   * @returns {boolean}
   */
  get isEmpty() { return this.left >= this.right || this.top >= this.bottom; }

  /**
   * @returns {number}
   */
  get width() { return Math.max(this.right - this.left, 0); }

  /**
   * @returns {number}
   */
  get height() { return Math.max(this.bottom - this.top, 0); }

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
   * @typedef {object} Point
   * @property {number} x
   * @property {number} y
   */
  /**
   * @returns {Point} point
   */
  get center() {
    return {
      x: this.left + (this.width / 2),
      y: this.top + (this.height / 2),
    };
  }

  /**
   * @param {?DOMRect|?ClientRect|?Rect|?object} rect
   */
  constructor(rect) {
    if (rect) {
      this.left = rect.left || rect.x || 0;
      this.top = rect.top || rect.y || 0;
      this.right = rect.right || this.left + (rect.width || 0);
      this.bottom = rect.bottom || this.top + (rect.height || 0);
    } else {
      this.left = 0;
      this.top = 0;
      this.right = 0;
      this.bottom = 0;
    }
  }

  /**
   * @param {DOMRect|ClientRect|Rect|object} rect
   * @returns {boolean}
   */
  equals(rect) {
    rect = new Rect(rect);
    return this.left === rect.left &&
      this.top === rect.top &&
      this.width === rect.width &&
      this.height === rect.height;
  }

  /**
   * @param {number|DOMRect|ClientRect|Rect|object} xOrRect
   * @param {number} y
   * @returns {boolean}
   */
  contains(xOrRect, y) {
    if (this.isEmpty) {
      return false;
    }
    if (typeof xOrRect !== 'number') {
      const rect = new Rect(xOrRect);
      if (rect.isEmpty) {
        return false;
      }
      return this.left <= rect.left &&
        this.top <= rect.top &&
        this.right >= rect.right &&
        this.bottom >= rect.bottom;
    }
    return this.left <= xOrRect && xOrRect <= this.right && this.top <= y && y <= this.bottom;
  }

  /**
   * @param {number} widthOrLeftOrAll
   * @param {number} heightOrTop
   * @param {number} right
   * @param {number} bottom
   * @returns {Rect}
   */
  inset(widthOrLeftOrAll, heightOrTop, right, bottom) {
    if (widthOrLeftOrAll === undefined) {
      return this;
    } else if (heightOrTop === undefined && right === undefined && bottom === undefined) {
      const inset = widthOrLeftOrAll;
      return this.inset(inset, inset, inset, inset);
    } else if (right === undefined && bottom === undefined) {
      const width = widthOrLeftOrAll;
      const height = heightOrTop;
      return this.inset(width / 2, height / 2, width / 2, height / 2);
    }
    this.left -= widthOrLeftOrAll; // left
    this.top += heightOrTop; // top
    this.right -= right;
    this.bottom += bottom || 0;
    return this;
  }

  /**
   * @param {DOMRect|ClientRect|Rect|object} rect
   * @returns {Rect}
   */
  intersection(rect) {
    rect = new Rect(rect);
    const left = Math.max(this.left, rect.left);
    const top = Math.max(this.top, rect.top);
    const right = Math.min(this.right, rect.right);
    const bottom = Math.min(this.bottom, rect.bottom);
    if (left < right && top < bottom) {
      return new Rect({ left, top, right, bottom });
    }
    return new Rect();
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
    const {
      left, top, right, bottom,
      width, height,
      x, y,
    } = this;
    return {
      left,
      top,
      right,
      bottom,
      width,
      height,
      x,
      y,
    };
  }
}
