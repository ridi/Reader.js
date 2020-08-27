import _Sel from '../common/_Sel';

/**
 * @class Sel
 * @extends _Sel
 */
export default class Sel extends _Sel {
  /**
   * @returns {number}
   * @private
   */
  _getUpperBound() {
    return this._context.pageWidthUnit * (this._context.isDoublePageMode ? 2 : 1);
  }
}
