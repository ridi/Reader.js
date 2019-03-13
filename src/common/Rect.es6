export default class Rect {
  get isZero() { return this.left === 0 && this.top === 0 && this.right === 0 && this.bottom === 0; }

  get right() { return this.left + this.width; }

  get bottom() { return this.top + this.height; }

  /**
   * @param {DOMRect|ClientRect|Rect} rect
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
   * @param {Number} x
   * @param {Number} y
   * @returns {Boolean}
   */
  contains(x, y) {
    return this.left <= x && x <= this.right && this.top <= y && y <= this.bottom;
  }

  /**
   * @returns {Rect}
   */
  toNormalize() {
    return this.reader.normalizeRect(this);
  }

  /**
   * @returns {Rect}
   */
  toAbsolute() {
    return this.reader.convertAbsoluteRect(this);
  }

  /**
   * @returns {string}
   */
  toAbsoluteCoord() {
    return this.toAbsolute().toCoord();
  }

  /**
   * @returns {String}
   */
  toCoord() {
    return `${this.left},${this.top},${this.width},${this.height},`;
  }

  /**
   * @returns {Object}
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
