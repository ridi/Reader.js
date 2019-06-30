import _Sel from '../common/_Sel';

/**
 * @class Sel
 * @extends _Sel
 */
export default class Sel extends _Sel {
  /**
   * @param {Range} range
   * @returns {number}
   * @private
   */
  _clientLeftOfRangeForCheckingNextPageContinuable(range) {
    return range.getBoundingClientRect().toRect().left;
  }

  /**
   * @returns {number}
   * @private
   */
  _getUpperBound() {
    return this._context.pageWidthUnit * (this._context.isDoublePageMode ? 2 : 1);
  }

  /**
   * @returns {string}
   */
  expandIntoNextPage() {
    if (super.expandIntoNextPage()) {
      return this.getRectList().toJsonString();
    }
    return '';
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {string}
   */
  start(x, y) {
    if (super.start(x, y)) {
      return this.getRectList().toJsonString();
    }
    return '';
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {string}
   */
  expandIntoUpper(x, y) {
    if (super.expandIntoUpper(x, y)) {
      return this.getRectList().toJsonString();
    }
    return '';
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {string}
   */
  expandIntoLower(x, y) {
    if (super.expandIntoLower(x, y)) {
      return this.getRectList().toJsonString();
    }
    return '';
  }
}
