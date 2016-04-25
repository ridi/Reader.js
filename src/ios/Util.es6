import _Util from '../common/_Util';

export default class Util extends _Util {
  static getRectsFromSerializedRange(serializedRange) {
    const range = this.getRangeFromSerializedRange(serializedRange);
    const rects = this.getOnlyTextNodeRectsFromRange(range);
    return this.rectsToAbsoluteCoord(rects);
  }
}
