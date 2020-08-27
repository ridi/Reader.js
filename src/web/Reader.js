import Content from './Content';
import _Reader from '../common/_Reader';

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
   * @property {string} serializedRange
   * @property {rectList} RectList
   * @property {string} text
   * @property {number} page
   */
  /**
   * @param {string} keyword
   * @returns {?SearchResult}
   */
  searchText(keyword) {
    const serializedRange = super.searchText(keyword);
    if (serializedRange) {
      return {
        serializedRange,
        rectList: this.getRectListFromSearchResult(),
        text: this.getSurroundingTextForSearchResult(),
        page: this.getPageFromSearchResult(),
      };
    }
    return null;
  }
}
