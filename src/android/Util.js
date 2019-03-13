import _Util from '../common/_Util';

export default class Util extends _Util {
  /**
   * @param {string} message
   */
  static toast(message = '') {
    android.onShowToast(message, message.length > 20 ? 1 : 0);
  }
}

Util.staticOverride(Util, _Util, ['toast']);
