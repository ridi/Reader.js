import _Sel from '../common/_Sel';
import Util from './Util';
import App from './App';

export default class Sel extends _Sel {
  constructor(maxLength = 0) {
    super(maxLength);
    this._overflowed = false;
  }

  isOutOfBounds(range) {
    // 화면 하단 바깥쪽으로 드레그 했을 때 viewport 밖인데도 caretRangeFromPoint로 노드를 잡을 수 있어
    // 하이라이트가 뒷페이지까지 이어지는 문제가 발생하고 있다(Android 4.x~)
    // 이를 해결하기 위해 caretRangeFromPoint로 잡은 Range의 left가 현재 페이지를 벗어났는지를 확인한다
    const pageWidth = Util.getStylePropertyIntValue(document.documentElement, 'width');
    const testRange = document.createRange();
    testRange.selectNode(range.endContainer);
    const testRect = testRange.getAdjustedBoundingClientRect();
    return testRect.left > pageWidth;
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
      const coord = this._getSelectedRectsCoord();
      if (coord.length) {
        android.onStartSelectionMode(coord);
      }
    }
  }

  changeInitialSelection(x, y) {
    if (super.changeInitialSelection(x, y)) {
      const coord = this._getSelectedRectsCoord();
      if (coord.length) {
        android.onInitialSelectionChanged(coord);
      }
    }
  }

  extendUpperSelection(x, y) {
    if (super.extendUpperSelection(x, y)) {
      const coord = this._getSelectedRectsCoord();
      if (coord.length) {
        android.onSelectionChanged(coord, this.getSelectedText());
      }
    }
  }

  extendLowerSelection(x, y) {
    if (super.extendLowerSelection(x, y)) {
      const coord = this._getSelectedRectsCoord();
      if (coord.length) {
        android.onSelectionChanged(coord, this.getSelectedText());
      }
    }
  }

  requestSelectionInfo() {
    android.onSelectionInfo(this.getSelectedSerializedRange(), this.getSelectedText());
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
