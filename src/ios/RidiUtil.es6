import Util from '../common/Util';

export default class RidiUtil extends Util {
  static getRectsFromSerializedRange(serializedRange) {
    const range = this.getRangeFromSerializedRange(serializedRange);
    const rects = this.getOnlyTextNodeRectsFromRange(range);
    return this.rectsToAbsoluteCoord(rects);
  }
}
