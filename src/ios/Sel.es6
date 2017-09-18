import _Sel from '../common/_Sel';

export default class Sel extends _Sel {
  /**
   * @returns {number}
   */
  getUpperBound() {
    return app.pageWidthUnit * (app.doublePageMode ? 2 : 1);
  }

  /**
   * @param {TextRange} range
   * @returns {number}
   * @private
   */
  _clientLeftOfRangeForCheckingNextPageContinuable(range) {
    return range.getAdjustedBoundingClientRect().left;
  }

  /**
   * @returns {string}
   */
  expandSelectionIntoNextPage() {
    if (super.expandSelectionIntoNextPage()) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {string}
   */
  startSelectionMode(x, y) {
    if (super.startSelectionMode(x, y)) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {string}
   */
  changeInitialSelection(x, y) {
    if (super.changeInitialSelection(x, y, 'character')) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {string}
   */
  expandUpperSelection(x, y) {
    if (super.expandUpperSelection(x, y)) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {string}
   */
  expandLowerSelection(x, y) {
    if (super.expandLowerSelection(x, y)) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }
}
