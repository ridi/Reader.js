import _EPub from './_EPub';

export default class _Handler {
  static getLinkFromPoint(point) {
    const tolerance = 10;
    const startViewportWidth = window.pageXOffset;
    const endViewportWidth = startViewportWidth + document.body.clientWidth;
    for (let x = point.x - tolerance; x <= point.x + tolerance; x++) {
      for (let y = point.y - tolerance; y <= point.y + tolerance; y++) {
        if (x < startViewportWidth || x > endViewportWidth) {
          continue;
        }
        const el = document.elementFromPoint(x, y);
        if (el) {
          const link = _EPub.getLinkFromElement(el);
          if (link !== null) {
            return link;
          }
        }
      }
    }
    return null;
  }
}
