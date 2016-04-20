import _App from '../common/_App';

export default class App extends _App {
  constructor(width, height, systemMajorVersion, doublePageMode, scrollMode) {
    super(width, height, systemMajorVersion, doublePageMode, scrollMode);
    this._appInBackground = false;
  }

  isBackground() {
    return this._appInBackground;
  }

  didEnterBackground() {
    this._appInBackground = true;
  }

  didEnterForeground() {
    this._appInBackground = false;
  }

  static toast(message = '') {
    location.href = `ridi+epub://navigation/toast?${encodeURIComponent(message)}`;
  }
}
