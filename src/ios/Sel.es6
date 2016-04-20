import _Sel from '../common/_Sel';
import Util from './Util';
import App from './App';

export default class Sel extends _Sel {
  constructor(maxLength = 0) {
    super(maxLength);
    this._overflowed = false;
  }

  _getSelectedRectsCoord() {
    const rects = this.getSelectedRangeRects();
    if (rects.length) {
      this._overflowed = false;
      return Util.rectsToAbsoluteCoord(rects);
    }
    return '';
  }

  startSelectionMode(x, y) {
    if (super.startSelectionMode(x, y)) {
      return this._getSelectedRectsCoord();
    }
    return '';
  }

  changeInitialSelection(x, y) {
    if (super.changeInitialSelection(x, y, 'character')) {
      return this._getSelectedRectsCoord();
    }
    return '';
  }

  extendUpperSelection(x, y) {
    if (super.extendUpperSelection(x, y)) {
      return this._getSelectedRectsCoord();
    }
    return '';
  }

  extendLowerSelection(x, y) {
    if (super.extendLowerSelection(x, y)) {
      return this._getSelectedRectsCoord();
    }
    return '';
  }

  validLength(range) {
    if (!super.validLength(range)) {
      if (!this._overflowed) {
        App.toast(`최대 ${this._maxLength}자까지 선택할 수 있습니다`);
      }
      this._overflowed = true;
      return false;
    }
    return true;
  }
}
