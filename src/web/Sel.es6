import _Sel from '../common/_Sel';

export default class Sel extends _Sel {
  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {Boolean}
   */
  startSelectionMode(x, y) {
    return super.startSelectionMode(x, y, this.reader.content.wrapper);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {Boolean}
   */
  expandUpperSelection(x, y) {
    return super.expandUpperSelection(x, y, this.reader.content.wrapper);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {Boolean}
   */
  expandLowerSelection(x, y) {
    return super.expandLowerSelection(x, y, this.reader.content.wrapper);
  }
}
