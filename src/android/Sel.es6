import _Sel from '../common/_Sel';
import Util from './Util';

export default class Sel extends _Sel {
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

  startSelectionMode(x, y) {
    if (super.startSelectionMode(x, y)) {
      const coord = this.getSelectedRectsCoord();
      if (coord.length) {
        android.onStartSelectionMode(coord);
      }
    }
  }

  changeInitialSelection(x, y) {
    if (super.changeInitialSelection(x, y)) {
      const coord = this.getSelectedRectsCoord();
      if (coord.length) {
        android.onInitialSelectionChanged(coord);
      }
    }
  }

  extendUpperSelection(x, y) {
    if (super.extendUpperSelection(x, y)) {
      const coord = this.getSelectedRectsCoord();
      if (coord.length) {
        android.onSelectionChanged(coord, this.getSelectedText());
      }
    }
  }

  extendLowerSelection(x, y) {
    if (super.extendLowerSelection(x, y)) {
      const coord = this.getSelectedRectsCoord();
      if (coord.length) {
        android.onSelectionChanged(coord, this.getSelectedText());
      }
    }
  }

  requestSelectionInfo() {
    android.onSelectionInfo(this.getSelectedSerializedRange(), this.getSelectedText());
  }
}
