import _Sel from '../common/_Sel';

export default class Sel extends _Sel {
  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {MutableClientRect[]}
   */
  startSelectionMode(x, y) {
    if (super.startSelectionMode(x, y)) {
      return this.getSelectedRangeRects();
    }
    return [];
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {MutableClientRect[]}
   */
  expandUpperSelection(x, y) {
    if (super.expandUpperSelection(x, y)) {
      return this.getSelectedRangeRects();
    }
    return [];
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {MutableClientRect[]}
   */
  expandLowerSelection(x, y) {
    if (super.expandLowerSelection(x, y)) {
      return this.getSelectedRangeRects();
    }
    return [];
  }
}
