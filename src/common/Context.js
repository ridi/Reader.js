import _Object from './_Object';

/**
 * @class Context
 * @property {number} width column 너비
 * @property {number} height column 높이
 * @property {number} gap column 간 여백(두쪽 보기와 무관)
 * @property {boolean} isDoublePageMode 두쪽 보기
 * @property {boolean} isScrollMode 스크롤 보기
 * @property {number} maxSelectionLength 셀렉션 최대 길이
 * @property {number} systemMajorVersion OS 버전(네이티브 전용)
 * @property {boolean} customElementDetectionEnabled elementFromPoint 구현 방식을 viewport 내 최상위가 아닌 특정 엘리먼트 내 최상위로 바꾼다.
 * @property {boolean} shouldViewportInitialize width와 height 값으로 viewport를 초기화한다.
 * @property {boolean} shouldTwoPageAsOneWhenDoublePageMode 두쪽 보기에서 column 두 개를 한 페이지로 구분하도록 한다.
 */
export default class Context extends _Object {
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
    super();
    this.width = undefined;
    this.height = undefined;
    this.gap = undefined;
    this.isDoublePageMode = false;
    this.isScrollMode = false;
    this.maxSelectionLength = 1000;
    this.systemMajorVersion = undefined;
    this.customElementDetectionEnabled = false;
    this.shouldViewportInitialize = false;
    this.shouldTwoPageAsOneWhenDoublePageMode = false;
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
