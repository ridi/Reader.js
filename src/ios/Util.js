import _Util from '../common/_Util';

export default class Util extends _Util {
  /**
   * @param {string} message
   */
  static toast(message = '') {
    window.location.href = `ridi+epub://invocation/toast?${encodeURIComponent(message)}`;
  }
}

Util.staticOverride(Util, _Util, ['toast']);
