import _Util from '../common/_Util';

export default class Util extends _Util {
  /**
   * @param {string} message
   */
  static toast(message = '') {
    alert(message);
  }
}

Util.staticOverride(Util, _Util, ['toast']);
