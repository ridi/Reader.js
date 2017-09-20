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
   * @returns {function}
   */
  get adjustPoint() { return this._adjustPoint; }

  /**
   * @param {Content} content
   * @param {Context} context
   * @param {function} adjustPoint
   */
  constructor(content, context, adjustPoint) {
    super();
    this._content = content;
    this._context = context;
    this._adjustPoint = adjustPoint;
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
   * @param {Number} x
   * @param {Number} y
   * @returns {{node: Node, href: String, type: String}|null}
   */
  getLinkFromPoint(x, y) {
    const point = this.adjustPoint(x, y);
    const tolerance = 10;
    for (let _x = point.x - tolerance; _x <= point.x + tolerance; _x++) {
      for (let _y = point.y - tolerance; _y <= point.y + tolerance; _y++) {
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
