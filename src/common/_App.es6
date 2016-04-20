export default class _App {
  get doublePageMode() { return this._doublePageMode; }
  get scrollMode() { return this._scrollMode; }
  get pageWidthUnit() { return this._width; }
  get pageHeightUnit() { return this._height; }
  get systemMajorVersion() { return this._systemMajorVersion; }
  get pageUnit() {
    if (this.scrollMode) {
      return this.pageHeightUnit;
    }
    return this.pageWidthUnit;
  }

  constructor(width, height, systemMajorVersion, doublePageMode, scrollMode) {
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
}
