import _Sel from '../common/_Sel';

export default class Sel extends _Sel {
  extendSelectionIntoNextPage() {
    if (super.extendSelectionIntoNextPage()) {
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

  extendUpperSelection(x, y) {
    if (super.extendUpperSelection(x, y)) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }

  extendLowerSelection(x, y) {
    if (super.extendLowerSelection(x, y)) {
      return this.getSelectedRectsCoord();
    }
    return '';
  }
}
