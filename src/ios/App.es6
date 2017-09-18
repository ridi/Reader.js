import _App from '../common/_App';
import EPub from './EPub';

export default class App extends _App {
  /**
   * @param {number} width
   * @param {number} height
   * @param {number} systemMajorVersion
   * @param {boolean} doublePageMode
   * @param {boolean} scrollMode
   */
  constructor(width, height, systemMajorVersion, doublePageMode, scrollMode) {
    super(width, height, systemMajorVersion, doublePageMode, scrollMode);
    this._appInBackground = false;
  }

  /**
   * @returns {boolean}
   */
  isBackground() {
    return this._appInBackground;
  }

  didEnterBackground() {
    this._appInBackground = true;
  }

  didEnterForeground() {
    this._appInBackground = false;
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {string} style
   * @param {number} fontSize
   */
  changePageSizeWithStyle(width, height, style, fontSize) {
    const prevPage = this.getCurPage();

    this._width = width;
    this._height = height;

    const styleElements = document.getElementsByTagName('style');
    const styleElement = styleElements[styleElements.length - 1];
    styleElement.innerHTML = style;

    const bodyStyle = document.body.style;
    bodyStyle['font-size'] = `${fontSize}%`;

    EPub.scrollTo(prevPage * this.pageUnit);
  }

  /**
   * @param {string} message
   */
  static toast(message = '') {
    location.href = `ridi+epub://invocation/toast?${encodeURIComponent(message)}`;
  }
}

App.staticOverride(App, _App, ['toast']);
