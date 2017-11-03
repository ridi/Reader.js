import _Sel from '../common/_Sel';

export default class Sel extends _Sel {
  /**
   * @param {Range} range
   * @returns {Number}
   * @private
   */
  _clientLeftOfRangeForCheckingNextPageContinuable(range) {
    return range.getAdjustedBoundingClientRect().left;
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
  expandSelectionIntoNextPage() {
    if (super.expandSelectionIntoNextPage()) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {String}
   */
  startSelectionMode(x, y) {
    if (super.startSelectionMode(x, y)) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {String}
   */
  changeInitialSelection(x, y) {
    if (super.changeInitialSelection(x, y, 'character')) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {String}
   */
  expandUpperSelection(x, y) {
    if (super.expandUpperSelection(x, y)) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {String}
   */
  expandLowerSelection(x, y) {
    if (super.expandLowerSelection(x, y)) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }
}
