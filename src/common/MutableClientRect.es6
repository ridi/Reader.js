export default class MutableClientRect {
  get isEmpty() { return this.left === 0 && this.top === 0 && this.right === 0 && this.bottom === 0; }

  /**
   * @param {ClientRect} rect
   */
  constructor(rect) {
    if (rect) {
      this.left = rect.left || 0;
      this.top = rect.top || 0;
      this.right = rect.right || 0;
      this.bottom = rect.bottom || 0;
      this.width = rect.width || 0;
      this.height = rect.height || 0;
    } else {
      this.left = 0;
      this.top = 0;
      this.right = 0;
      this.bottom = 0;
      this.width = 0;
      this.height = 0;
    }
  }
}
