import _Sel from '../common/_Sel';

export default class Sel extends _Sel {
  getUpperBound() {
    return app.pageWidthUnit * (app.doublePageMode ? 2 : 1);
  }

  expandSelectionIntoNextPage() {
    if (super.expandSelectionIntoNextPage()) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  startSelectionMode(x, y) {
    if (super.startSelectionMode(x, y)) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  changeInitialSelection(x, y) {
    if (super.changeInitialSelection(x, y, 'character')) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  expandUpperSelection(x, y) {
    if (super.expandUpperSelection(x, y)) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  expandLowerSelection(x, y) {
    if (super.expandLowerSelection(x, y)) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }
}
