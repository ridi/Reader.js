import _Object from './_Object';

export default class _Handler extends _Object {
  /**
   * @returns {Content}
   */
  get content() { return this._content; }

  /**
   * @returns {Context}
   */
  get context() { return this._context; }

  /**
   * @param {Content} content
   * @param {Context} context
   */
  constructor(content, context) {
    super();
    this._content = content;
    this._context = context;
  }

  /**
   * @param {Context} context
   */
  changeContext(context) {
    this._context = context;
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
   * @param {{x: Number, y: Number}} point
   * @returns {{node: Node, href: String, type: String}|null}
   */
  getLinkFromPoint(point) {
    const tolerance = 10;
    for (let x = point.x - tolerance; x <= point.x + tolerance; x++) {
      for (let y = point.y - tolerance; y <= point.y + tolerance; y++) {
        if (this.isInViewportWidth(x)) {
          const el = document.elementFromPoint(x, y);
          if (el) {
            const link = this.content.getLinkFromElement(el);
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
