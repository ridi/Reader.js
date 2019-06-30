import _Sel from '../common/_Sel';
import Util from '../common/Util';

/**
 * @class Sel
 * @extends _Sel
 */
export default class Sel extends _Sel {
  /**
   * @param {Range} range
   * @returns {boolean}
   * @private
   */
  _isOutOfBounds(range) {
    // 화면 하단 바깥쪽으로 드레그 했을 때 viewport 밖인데도 caretRangeFromPoint로 노드를 잡을 수 있어
    // 하이라이트가 뒷페이지까지 이어지는 문제가 발생하고 있다(Android 4.x~)
    // 이를 해결하기 위해 caretRangeFromPoint로 잡은 Range의 left가 현재 페이지를 벗어났는지를 확인한다
    const pageWidth = Util.getStylePropertyIntValue(this._content.ref, 'width');
    const testRange = document.createRange();
    testRange.selectNode(range.endContainer);
    const testRect = testRange.getBoundingClientRect().toRect();
    return testRect.left > pageWidth;
  }

  /**
   * @param {Range} range
   * @returns {number}
   * @private
   */
  _clientLeftOfRangeForCheckingNextPageContinuable(range) {
    const rect = range.getBoundingClientRect().toRect();
    return Math.floor(rect.left + rect.width);
  }

  /**
   * @returns {number}
   * @private
   */
  _getUpperBound() {
    return this._context.pageWidthUnit;
  }

  expandIntoNextPage() {
    if (super.expandIntoNextPage()) {
      const string = this.getRectList().toJsonString();
      if (string.length) {
        android.onSelectionChangeIntoNextPage(string);
      }
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  start(x, y) {
    if (super.start(x, y)) {
      const string = this.getRectList().toJsonString();
      if (string.length) {
        android.onStartSelectionMode(string);
      }
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  expandIntoUpper(x, y) {
    if (super.expandIntoUpper(x, y)) {
      const string = this.getRectList().toJsonString();
      if (string.length) {
        android.onSelectionChanged(string, this.getText());
      }
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  expandIntoLower(x, y) {
    if (super.expandIntoLower(x, y)) {
      const string = this.getRectList().toJsonString();
      if (string.length) {
        android.onSelectionChanged(string, this.getText());
      }
    }
  }

  requestSelectionInfo() {
    android.onSelectionInfo(
      this.getSerializedRange(),
      this.getText(),
      this.isExpandContinuableIntoNextPage,
    );
  }
}
