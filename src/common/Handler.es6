import EPub from './EPub';

export default class Handler {
  static getLinkFromPoint(point) {
    const tolerance = 4;
    for (let x = point.x - tolerance; x <= point.x + tolerance; x++) {
      for (let y = point.y - tolerance; y <= point.y + tolerance; y++) {
        const el = document.elementFromPoint(x, y);
        if (el) {
          const link = EPub.getLinkFromElement(el);
          if (link !== null) {
            return link;
          }
        }
      }
    }
    return null;
  }
}
