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
    const tolerance = 12;
    for (let x = point.x - tolerance; x <= point.x + tolerance; x += 6) { // eslint-disable-line no-shadow
      for (let y = point.y - tolerance; y <= point.y + tolerance; y += 6) { // eslint-disable-line no-shadow
        const el = document.elementFromPoint(x, y);
        if (el) {
          const link = this.reader.content.getLinkFromElement(el);
          if (link !== null) {
            return link;
          }
        }
      }
    }
    return null;
  }
}
