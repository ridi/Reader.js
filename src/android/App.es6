import _App from '../common/_App';
import Util from './Util';
import EPub from './EPub';

export default class App extends _App {
  get chromeMajorVersion() { return this._chromeMajorVersion; }
  get pageWeightForChrome() { return this._pageWeightForChrome; }
  get pageOverflowForChrome() { return this._pageOverflowForChrome; }
  get prevPage() { return this._prevPage; }
  get contentsSrc() { return this._contentsSrc; }

  constructor(width, height, systemMajorVersion, doublePageMode, scrollMode, contentsSrc, pageOffset = 0) {
    super(width, height, systemMajorVersion, doublePageMode, scrollMode);
    const chrome = ((navigator.userAgent || '').match(/chrome\/[\d]+/gi) || [''])[0];
    const version = parseInt((chrome.match(/[\d]+/g) || [''])[0], 10);
    if (!isNaN(version)) {
      this._chromeMajorVersion = version;
      if (Util.checkCurseInChrome(version) && !this.scrollMode) {
        const pageWeight = Math.min(pageOffset, CURSE);
        this._pageWeightForChrome = pageWeight;
        this._pageOverflowForChrome = pageWeight === CURSE;
        this._prevPage = pageOffset;
        this._setScrollListener();
      }
    }
    this.calcPageForDoublePageMode = false;
    this._contentsSrc = contentsSrc;
  }

  applyColumnProperty(width, gap) {
    document.documentElement.setAttribute('style',
      `-webkit-column-width: ${width}px !important; ` +
      `-webkit-column-gap: ${gap}px !important;`);
    let style = (document.body.attributes.style || { nodeValue: '' }).nodeValue;
    const originStyle = style;
    style += 'margin-top: -1px !important;';
    document.body.setAttribute('style', style);
    setTimeout(() => {
      document.body.setAttribute('style', originStyle);
    }, 0);
  }

  changePageSizeWithStyle(width, height, style) {
    const prevPage = this.getCurPage();

    this._width = width;
    this._height = height;

    const styleElements = document.getElementsByTagName('style');
    const styleElement = styleElements[styleElements.length - 1];
    styleElement.innerHTML = style;
    EPub.scrollTo(prevPage * this.pageUnit);
  }

  _setScrollListener() {
    window.addEventListener('scroll', () => {
      if (Util.checkCurseInChrome()) {
        // * Chrome 47, 49+ 대응
        // viewport의 범위와 curPage의 clientLeft 기준이 변경됨에 따라 아래와 같이 대응함
        // (Util._rectToRelativeForChromeInternal, Util.adjustPoint 참고)
        // - 페이지 이동에 따라 0~3의 가중치(pageWeight)를 부여
        // - rect.left 또는 touchPointX에 'pageWeight * pageUnit' 값을 빼거나 더함
        // - 가중치가 3에 도달한 후 0이 되기 전까지는 'pageGap * 3' 값을 더하거나 뺌
        const curPage = this.getCurPage();
        const prevPage = this.prevPage;
        let pageWeight = this.pageWeightForChrome;
        if (curPage > prevPage) { // next
          pageWeight = Math.min(pageWeight + (curPage - prevPage), CURSE);
          if (!this._pageOverflowForChrome) {
            this._pageOverflowForChrome = pageWeight === CURSE;
          }
        } else if (curPage < prevPage) { // prev
          pageWeight = Math.max(pageWeight - (prevPage - curPage), 0);
          if (pageWeight === 0) {
            this._pageOverflowForChrome = false;
          }
        }
        this._prevPage = curPage;
        this._pageWeightForChrome = pageWeight;
      }
    });
  }

  _movoTo(...args) {
    const target = args[0];
    const method = args[1];
    if (this.scrollMode) {
      const scrollYOffset = target[`getScrollYOffsetFrom${method}`](args[2], args[3]);
      if (scrollYOffset !== null) {
        android[`onScrollYOffsetOf${method}Found`](android.dipToPixel(scrollYOffset));
        return;
      }
    } else {
      const pageOffset = target[`getPageOffsetFrom${method}`](args[2], args[3]);
      if (pageOffset !== null) {
        android[`onPageOffsetOf${method}Found`](pageOffset);
        return;
      }
    }
    const notFound = android[`on${method}NotFound`];
    if (notFound) {
      notFound();
    }
  }

  moveToAnchor(anchor) {
    this._movoTo(EPub, 'Anchor', anchor);
  }

  moveToSerializedRange(serializedRange) {
    this._movoTo(EPub, 'SerializedRange', serializedRange);
  }

  moveToTopNodeLocation(nodeIndex, wordIndex) {
    this._movoTo(EPub, 'TopNodeLocation', nodeIndex, wordIndex);
  }

  static toast(message = '') {
    android.onShowToast(message, message.length > 20 ? 1 : 0);
  }
}

App.staticOverride(App, _App, ['toast']);
