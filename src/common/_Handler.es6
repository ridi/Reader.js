import _Object from './_Object';

export default class _Handler extends _Object {
  /**
   * @returns {Reader}
   */
  get reader() { return this._reader; }

  /**
   * @param {Reader} reader
   */
  constructor(reader) {
    super();
    this._reader = reader;
  }

  /**
   * x가 viewport에 속하는지 확인한다.
   *
   * @param {Number} x
   * @returns {Boolean}
   */
  isInViewportWidth(/* x */) {
    return true;
  }

  /**
   * 해당 좌표에서 링크를 찾아서 반환한다.
   *
   * @param {Number} x
   * @param {Number} y
   * @returns {{node: Node, href: String, type: String}|null}
   */
  getLinkFromPoint(x, y) {
    const tolerance = 10;
    const anchors = document.links;

    for (let i = 0; i < anchors.length; i++) {
      const rects = anchors[i].getClientRects();
      for (let j = 0; j < rects.length; j++) {
        if ((x >= rects[j].left - tolerance) && (x <= rects[j].right + tolerance) &&
          (y >= rects[j].top - tolerance) && (y <= rects[j].bottom + tolerance)) {
          const link = this.reader.content.getLinkFromElement(anchors[i]);
          if (link !== null) {
            return link;
          }
        }
      }
    }
    return null;
  }
}
