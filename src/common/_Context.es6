import _Object from './_Object';

export default class _Context extends _Object {
  /**
   * @returns {Number}
   */
  get pageWidthUnit() { return this._width + this.pageGap; }

  /**
   * @returns {Number}
   */
  get pageHeightUnit() { return this._height; }

  /**
   * @returns {Number}
   */
  get pageGap() { return this._gap; }

  /**
   * @returns {Number}
   */
  get pageUnit() { return this.isScrollMode ? this.pageHeightUnit : this.pageWidthUnit; }

  /**
   * @returns {Boolean}
   */
  get isDoublePageMode() { return this._doublePageMode; }

  /**
   * @returns {Boolean}
   */
  get isScrollMode() { return this._scrollMode; }

  /**
   * @returns {Number}
   */
  get systemMajorVersion() { return this._systemMajorVersion; }

  /**
   * @returns {Number}
   */
  get maxSelectionLength() { return this._maxSelectionLength; }

  /**
   * @param {Number} width
   * @param {Number} height
   * @param {Number} gap
   * @param {Boolean} doublePageMode
   * @param {Boolean} scrollMode
   * @param {Number} systemMajorVersion
   * @param {Number} maxSelectionLength
   */
  constructor(width, height, gap, doublePageMode, scrollMode, systemMajorVersion = 0, maxSelectionLength = 0) {
    super();
    this._width = width;
    this._height = height;
    this._gap = gap;
    this._doublePageMode = doublePageMode;
    this._scrollMode = scrollMode;
    this._systemMajorVersion = systemMajorVersion;
    this._maxSelectionLength = maxSelectionLength;
  }
}
