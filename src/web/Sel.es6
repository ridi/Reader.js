import _Sel from '../common/_Sel';

export default class Sel extends _Sel {
  /**
   * @param {Number} x
   * @param {Number} y
   * @param {String} unit
   * @returns {Boolean}
   */
  start(x, y, unit) {
    return super.start(x, y, this.reader.content.wrapper, unit);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {String} unit
   * @returns {Boolean}
   */
  expandIntoUpper(x, y, unit) {
    return super.expandIntoUpper(x, y, this.reader.content.wrapper, unit);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {String} unit
   * @returns {Boolean}
   */
  expandIntoLower(x, y, unit) {
    return super.expandIntoLower(x, y, this.reader.content.wrapper, unit);
  }
}
