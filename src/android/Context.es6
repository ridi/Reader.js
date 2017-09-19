import _Context from '../common/_Context';

export default class Context extends _Context {
  /**
   * @returns {Number}
   */
  get chromeMajorVersion() { return this._chromeMajorVersion; }

  /**
   * @returns {Boolean}
   */
  get isCursedChrome() {
    const version = this.chromeMajorVersion;
    return version === 47 || (version >= 49 && version < 61);
  }

  /**
   * @param {Boolean} width
   * @param {Boolean} height
   * @param {Boolean} gap
   * @param {Boolean} doublePageMode
   * @param {Boolean} scrollMode
   * @param {Boolean} systemMajorVersion
   */
  constructor(width, height, gap, doublePageMode, scrollMode, systemMajorVersion) {
    super(width, height, gap, doublePageMode, scrollMode, systemMajorVersion);

    const chrome = ((navigator.userAgent || '').match(/chrome\/[\d]+/gi) || [''])[0];
    const version = parseInt((chrome.match(/[\d]+/g) || [''])[0], 10);
    if (!isNaN(version)) {
      this._chromeMajorVersion = version;
    }
  }
}
