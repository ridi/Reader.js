import Content from './Content';
import Context from '../common/Context';
import Rect from '../common/Rect';
import Util from '../common/Util';
import _Reader from '../common/_Reader';

/**
 * @class Reader
 * @extends _Reader
 */
export default class Reader extends _Reader {
  /**
   * @param {HTMLElement} ref
   * @returns {Content}
   * @private
   */
  _createContent(ref) {
    return new Content(ref, this);
  }

  injectMethods() {
    super.injectMethods();

    Util.injectMethod(Rect.prototype, 'toObject', function toObject() {
      return [[this.left, this.top], [this.width, this.height]];
    }, true);
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {number} gap
   * @param {string} style
   * @param {number} fontSize
   */
  changePageSizeWithStyle(width, height, gap, style, fontSize) {
    this.context = Context.build((context) => {
      Object.assign(context, this.context);
      Object.assign(context, { width, height, gap });
    });

    const elements = Array.from(document.querySelectorAll('style'));
    const element = elements[elements.length - 1];
    element.innerHTML = style;

    const wrapperStyle = this.getContent().ref.style;
    wrapperStyle['font-size'] = `${fontSize}%`;
  }

  /**
   * @param {number} top
   * @param {number} bottom
   */
  changePadding(top, bottom) {
    const wrapperStyle = this.getContent().ref.style;
    wrapperStyle.setProperty('padding-top', `${top}px`, 'important');
    wrapperStyle.setProperty('padding-bottom', `${bottom}px`, 'important');
  }
}
