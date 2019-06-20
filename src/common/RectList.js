/**
 * @class RectList
 * @extends Array
 */
export default class RectList extends Array {
  /**
   * @param {number|DOMRect|ClientRect|Rect|object} xOrRect
   * @param {?number} y
   * @returns {boolean}
   */
  contains(xOrRect, y) {
    if (typeof xOrRect === 'number' && y !== undefined) {
      return this.find(rect => rect.contains(xOrRect, y)) !== undefined;
    }
    return this.find(rect => rect.equals(xOrRect)) !== undefined;
  }

  /**
   * @returns {RectList}
   */
  trim() {
    // Webkit, Chrome 버전에 따라 다음 페이지의 첫 글자를 선택했을 때
    // 마지막 rect의 너비가 1 이하인 값이 들어오게 되는데 이게 오작동을
    // 발생시키는 요인이 되기 때문에 버린다.
    return this.filter(rect => rect.width > 1);
  }

  /**
   * @returns {string}
   */
  toCoord() {
    return this.map(rect => rect.toCoord()).join('');
  }
}
