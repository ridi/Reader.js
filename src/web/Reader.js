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
   * @returns {number} one-based page number
   */
  get curPage() { return super.curPage + 1; }

  /**
   * @param {HTMLElement} ref
   * @returns {Content}
   * @private
   */
  _createContent(ref) {
    return new Content(ref, this);
  }

  /**
   * @typedef {object} SearchResult
   * @property {string} serializedString
   * @property {rectList} RectList
   * @property {string} text
   * @property {number} page
   */
  /**
   * @param {string} keyword
   * @returns {?SearchResult}
   */
  searchText(keyword) {
    const serializedString = super.searchText(keyword);
    if (serializedString) {
      return {
        serializedString,
        rectList: this.getRectListFromSearchResult(),
        text: this.getSurroundingTextForSearchResult(),
        page: this.getPageFromSearchResult(),
      };
    }
    return null;
  }
}
