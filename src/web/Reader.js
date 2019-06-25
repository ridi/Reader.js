import _Reader from '../common/_Reader';
import Content from './Content';

/**
 * @class Reader
 * @extends _Reader
 */
export default class Reader extends _Reader {
  /**
   * @returns {number}
   */
  get pageXOffset() { return this._wrapper.parentElement.scrollLeft; }

  /**
   * @returns {number}
   */
  get pageYOffset() { return this._wrapper.parentElement.scrollTop; }

  /**
   * @param {HTMLElement} ref
   * @returns {Content}
   * @private
   */
  _createContent(ref) {
    return new Content(ref, this);
  }
}
