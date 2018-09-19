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
   * 해당 좌표에서 링크를 찾아서 반환한다.
   *
   * @param {Number} x
   * @param {Number} y
   * @returns {{node: Node, href: String, type: String}|null}
   */
  getLinkFromPoint(x, y) {
    const point = this.reader.adjustPoint(x, y);
    const tolerance = 10;
    const links = [].slice.call(document.links);
    const predicate = (rect) => { // eslint-disable-line arrow-body-style
      return (point.x >= rect.left - tolerance) && (point.x <= rect.right + tolerance) &&
        (point.y >= rect.top - tolerance) && (point.y <= rect.bottom + tolerance);
    };
    return this.reader.content.getLinkFromElement(links.find((link) => {
      const rects = link.getAdjustedClientRects();
      return rects.find(predicate) !== undefined;
    }));
  }
}
