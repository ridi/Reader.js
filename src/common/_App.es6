import _Object from './_Object';

export default class _App extends _Object {
  /**
   * @returns {boolean}
   */
  get doublePageMode() { return this._doublePageMode; }

  /**
   * @returns {boolean}
   */
  get scrollMode() { return this._scrollMode; }

  /**
   * @returns {number}
   */
  get pageWidthUnit() { return this._width; }

  /**
   * @returns {number}
   */
  get pageHeightUnit() { return this._height; }

  /**
   * @returns {number}
   */
  get systemMajorVersion() { return this._systemMajorVersion; }

  /**
   * @returns {number}
   */
  get pageUnit() {
    if (this.scrollMode) {
      return this.pageHeightUnit;
    }
    return this.pageWidthUnit;
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {number} systemMajorVersion
   * @param {boolean} doublePageMode
   * @param {boolean} scrollMode
   */
  constructor(width, height, systemMajorVersion, doublePageMode, scrollMode) {
    super();

    this._width = width;
    this._height = height;
    this._doublePageMode = doublePageMode;
    this._scrollMode = scrollMode;

    // * Android
    //   ex) 14, 17, 19, ... (API level)
    // * iOS
    //   ex) 6, 7, 8, ...
    this._systemMajorVersion = systemMajorVersion;
  }

  /**
   * @returns {number}
   */
  getCurPage() {
    if (this.scrollMode) {
      return window.pageYOffset / this.pageHeightUnit;
    }
    return window.pageXOffset / this.pageWidthUnit;
  }
}
