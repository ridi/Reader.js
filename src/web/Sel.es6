import _Sel from '../common/_Sel';

export default class Sel extends _Sel {
  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {Boolean}
   */
  start(x, y) {
    return super.start(x, y, this.reader.content.wrapper);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {Boolean}
   */
  expandIntoUpper(x, y) {
    return super.expandIntoUpper(x, y, this.reader.content.wrapper);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {Boolean}
   */
  expandIntoLower(x, y) {
    return super.expandIntoLower(x, y, this.reader.content.wrapper);
  }
}
