import Util from './Util';
import EPub from './EPub';

export default class Handler {
  static getElementsFromPoint(x, y) {
    const point = Util.adjustPoint(x, y);
    const n = 4;
    const points = [
      { x: point.x, y: point.y },
      { x: point.x - n, y: point.y - n },
      { x: point.x + n, y: point.y - n },
      { x: point.x - n, y: point.y + n },
      { x: point.x + n, y: point.y + n }
    ];

    const els = [];
    for (const _point of points) {
      const el = document.elementFromPoint(_point.x, _point.y);
      if (el) {
        els.push(el);
      }
    }

    return els;
  }

  static getLink(x, y) {
    const els = this.getElementsFromPoint(x, y);
    for (const el of Array.from(els)) {
      const link = EPub.getLinkFromElement(el);
      if (link !== null) {
        return link;
      }
    }
    return null;
  }
}
