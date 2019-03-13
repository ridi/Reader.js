import _Sel from '../common/_Sel';

export default class Sel extends _Sel {
  /**
   * @param {Range} range
   * @returns {Number}
   * @private
   */
  _clientLeftOfRangeForCheckingNextPageContinuable(range) {
    return range.getBoundingClientRect().bind(this.reader).toNormalize().left;
  }

  /**
   * @returns {Number}
   */
  getUpperBound() {
    return this.reader.context.pageWidthUnit * (this.reader.context.isDoublePageMode ? 2 : 1);
  }

  /**
   * @returns {String}
   */
  expandIntoNextPage() {
    if (super.expandIntoNextPage()) {
      return this.getAbsoluteRectListCoord();
    }
    return '';
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {String}
   */
  start(x, y) {
    if (super.start(x, y)) {
      return this.getAbsoluteRectListCoord();
    }
    return '';
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {String}
   */
  expandIntoUpper(x, y) {
    if (super.expandIntoUpper(x, y)) {
      return this.getAbsoluteRectListCoord();
    }
    return '';
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {String}
   */
  expandIntoLower(x, y) {
    if (super.expandIntoLower(x, y)) {
      return this.getAbsoluteRectListCoord();
    }
    return '';
  }
}
