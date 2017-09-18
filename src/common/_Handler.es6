import _Object from './_Object';
import _EPub from './_EPub';

export default class _Handler extends _Object {
  /**
   * x가 viewport에 속하는지 확인한다.
   *
   * @param {number} x
   * @returns {boolean}
   */
  static isInViewportWidth(/* x */) {
    return true;
  }

  /**
   * 해당 좌표에서 링크를 찾아서 반환한다.
   *
   * @param {{x: number, y: number}} point
   * @returns {{node: Node, href: string, type: string}|null}
   */
  static getLinkFromPoint(point) {
    const tolerance = 10;
    for (let x = point.x - tolerance; x <= point.x + tolerance; x++) {
      for (let y = point.y - tolerance; y <= point.y + tolerance; y++) {
        if (this.isInViewportWidth(x)) {
          const el = document.elementFromPoint(x, y);
          if (el) {
            const link = _EPub.getLinkFromElement(el);
            if (link !== null) {
              return link;
            }
          }
        }
      }
    }
    return null;
  }
}
