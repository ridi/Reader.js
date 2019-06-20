import _Reader from '../common/_Reader';
import Content from './Content';

/**
 * @class Reader
 * @extends _Reader
 * @property {boolean} isInBackground
 */
export default class Reader extends _Reader {
  /**
   * @param {Context} context
   */
  constructor(context) {
    super(context);
    this.isInBackground = false;
  }

  /**
   * @param {HTMLElement} ref
   * @returns {Content}
   * @private
   */
  _createContent(ref) {
    return new Content(ref, this);
  }

  /**
   * @param {number} offset
   */
  scrollTo(offset = 0) {
    // offset이 maxOffset을 넘길 수 없도록 보정한다. 이게 필요한 이유는 아래와 같다.
    // - 보기 설정 미리보기를 보여주는 중에 마지막 페이지보다 뒤로 이동해 빈 페이지가 보이는 것을 방지
    let adjustOffset = offset;
    if (this.context.isScrollMode) {
      const height = this.context.pageHeightUnit;
      const maxOffset = this.totalHeight - height;
      adjustOffset = Math.min(adjustOffset, maxOffset);
    } else {
      const width = this.context.pageWidthUnit;
      const maxPage = Math.max(Math.ceil(this.totalWidth / width) - 1, 0);
      adjustOffset = Math.min(adjustOffset, maxPage * width);
    }
    super.scrollTo(adjustOffset);
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {number} gap
   * @param {string} style
   * @param {number} fontSize
   */
  changePageSizeWithStyle(width, height, gap, style, fontSize) {
    const prevPage = this.curPage;

    this.context = Object.assign(this.context, { width, height, gap });

    const elements = document.getElementsByTagName(Content.Tag.STYLE);
    const element = elements[elements.length - 1];
    element.innerHTML = style;

    const wrapperStyle = this._wrapper.style;
    wrapperStyle['font-size'] = `${fontSize}%`;

    this.scrollTo(prevPage * this.context.pageUnit);
  }
}
