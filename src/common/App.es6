import EPub from './EPub';

export default class App {
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

  constructor(width, height, systemMajorVersion) {
    this._width = width;
    this._height = height;
    this._scrollMode = height !== EPub.getTotalHeight();

    // * Android
    //   ex) 14, 17, 19, ... (API level)
    // * iOS
    //   ex) 6, 7, 8, ...
    this._systemMajorVersion = systemMajorVersion;
  }
}
