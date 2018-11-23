/* eslint-disable no-console */
export default class Logger {
  static info(message, ...optionalParams) {
    console.log(message, ...optionalParams);
  }

  static debug(message, ...optionalParams) {
    if (DEBUG) {
      console.log(message, ...optionalParams);
    }
  }

  static error(message, ...optionalParams) {
    console.error(message, ...optionalParams);
  }
}
