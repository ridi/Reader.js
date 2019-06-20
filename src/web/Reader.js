import _Reader from '../common/_Reader';
import Content from './Content';

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
}
