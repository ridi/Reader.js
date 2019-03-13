import _Context from '../common/_Context';

export default class Context extends _Context {
  /**
   * @returns {Number}
   */
  get pageWidthUnit() { return (this._width + this.pageGap) * (this.isDoublePageMode ? 2 : 1); }
}
