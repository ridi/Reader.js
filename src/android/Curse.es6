import _Object from '../common/_Object';

export default class Curse extends _Object {
  /**
   * Chrome 47, 49+ 대응용 매직넘버.
   *
   * @returns {Number}
   */
  get magic() { return 3; }

  /**
   * @param {Number} curPage (zero-base)
   */
  constructor(curPage) {
    super();
    this.pageWeight = Math.min(curPage, this.magic);
    this.pageOverflow = this.pageWeight === this.magic;
    this.prevPage = curPage;
  }
}
