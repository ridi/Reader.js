import Logger from './Logger';

/**
 * @class Context
 * @property {number} width column 너비
 * @property {number} height column 높이
 * @property {number} gap column 간 여백(두쪽 보기와 무관)
 * @property {boolean} isDoublePageMode 두쪽 보기
 * @property {boolean} isScrollMode 스크롤 보기
 * @property {number} maxSelectionLength 셀렉션 최대 길이
 * @property {number} systemMajorVersion OS 버전(네이티브 전용)
 * @property {boolean} isSameDomAsUi 콘텐츠가 뷰어 UI와 같은 DOM에 있다.
 * @property {boolean} shouldViewportInitialize width와 height 값으로 viewport를 초기화한다.
 * @property {boolean} shouldTwoPageAsOneWhenDoublePageMode 두쪽 보기에서 column 두 개를 한 페이지로 구분하도록 한다.
 * @property {function} onMessage 사용자에게 보여줘야할 메세지를 처리하기 위한 용도, 기본 구현은 'console.log'.
 */
export default class Context {
  /**
   * @returns {number} 페이지 간격
   */
  get pageGap() { return this.gap; }

  /**
   * @returns {number} 한 페이지의 너비 또는 높이
   */
  get pageUnit() {
    return this.isScrollMode ? this.pageHeightUnit : this.pageWidthUnit;
  }

  /**
   * @returns {number} 한 페이지 너비
   */
  get pageWidthUnit() {
    const weight = this.shouldTwoPageAsOneWhenDoublePageMode && this.isDoublePageMode ? 2 : 1;
    return (this.width + this.pageGap) * weight;
  }

  /**
   * @returns {number} 한 페이지 높이
   */
  get pageHeightUnit() {
    return this.height;
  }

  /**
   * @private
   */
  constructor() {
    this.width = undefined;
    this.height = undefined;
    this.gap = undefined;
    this.isDoublePageMode = false;
    this.isScrollMode = false;
    this.maxSelectionLength = 1000;
    this.systemMajorVersion = undefined;
    this.isSameDomAsUi = false;
    this.shouldViewportInitialize = false;
    this.shouldTwoPageAsOneWhenDoublePageMode = false;
    this.shouldConsiderVerticalMarginsWhenReviseImages = true;
    this.onMessage = message => Logger.info(message);
  }

  /**
   * @returns {object}
   */
  toObject() {
    return {
      width: this.width,
      height: this.height,
      gap: this.height,
      isDoublePageMode: this.isDoublePageMode,
      isScrollMode: this.isScrollMode,
      maxSelectionLength: this.maxSelectionLength,
      systemMajorVersion: this.systemMajorVersion,
      isSameDomAsUi: this.isSameDomAsUi,
      shouldViewportInitialize: this.shouldViewportInitialize,
      shouldTwoPageAsOneWhenDoublePageMode: this.shouldTwoPageAsOneWhenDoublePageMode,
      onMessage: this.onMessage,
    };
  }

  /**
   * @param {function} builder
   * @returns {Context}
   */
  static build(builder) {
    const context = new Context();
    builder(context);
    Object.freeze(context);
    return context;
  }
}
