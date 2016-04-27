import _App from '../common/_App';
import Util from './Util';
import EPub from './EPub';

export default class App extends _App {
  get chromeMajorVersion() { return this._chromeMajorVersion; }
  get pageWeightForChrome() { return this._pageWeightForChrome; }
  get pageOverflowForChrome() { return this._pageOverflowForChrome; }
  get prevPage() { return this._prevPage; }

  constructor(width, height, systemMajorVersion, doublePageMode, scrollMode, pageOffset = 0) {
    super(width, height, systemMajorVersion, doublePageMode, scrollMode);
    const chrome = ((navigator.userAgent || '').match(/chrome\/[\d]+/gi) || [''])[0];
    const version = parseInt((chrome.match(/[\d]+/g) || [''])[0], 10);
    if (!isNaN(version)) {
      this._chromeMajorVersion = version;
      if (Util.checkCurseInChrome(version) && !this.scrollMode) {
        this._pageWeightForChrome = Math.min(pageOffset, CURSE);
        this._pageOverflowForChrome = false;
        this._prevPage = pageOffset;
        this._setScrollListener();
      }
    }
    this.calcPageForDoublePageMode = false;
  }

  updatePageSize(width, height) {
    this._width = width;
    this._height = height;
  }

  getColumnGap() {
    return Util.getStylePropertyIntValue(document.documentElement, '-webkit-column-gap');
  }

  getCurPage() {
    if (this.scrollMode) {
      return window.pageYOffset / this.pageHeightUnit;
    }
    return window.pageXOffset / this.pageWidthUnit;
  }

  _setScrollListener() {
    window.addEventListener('scroll', () => {
      if (Util.checkCurseInChrome()) {
        // * Chrome 47, 49 대응
        // 현재 페이지를 기준으로 rect를 구할 때 left의 기준이 변경됨에 따라 아래와 같이 대응함 (rectToRelativeForChrome)
        // 1) 다음 페이지 이동만 할 때
        //   1-1) 현재 페이지가 1~3 페이지일 때는 left에 pageUnit * pageWeight만큼 뻬야 한다
        //   1-2) 4 페이지 이상일 때는 pageGap을 제외한 pageUnit에 3(pageWeight의 최대치)을 곱한만큼 뻬야 한다
        // 2) 다음 페이지 이동만 하다가 이전 페이지로 이동할 때
        //   2-1) 이전 페이지 이동을 하기 전 페이지를 기준으로 3회 미만 이동할 때
        //      2-1-1) pageGap에 이동한 페이지 수(3 - pageWeight)를 곱한만큼 더해야 한다
        //   2-2) 3회 이상 이동할 때 (pageOverflowForChrome = true)
        //      2-2-1) pageUnit * pageWeight만큼 뻬야 한다
        //   2-3) pageOverflowForChrome가 true가 되면 pageWeight가 3이 되기 전까지 2-2를 사용한다
        // 현재 페이지에 대한 터치 포인트 기준도 변경됨에 따라 아래와 같이 대응함 (offsetToAbsoluteForChrome)
        // 1) left에 대한 대응에서 '빼기'를 '더하기'로 '더하기'를 '빼기'로 바꾼게 터치에 대한 대응
        const curPage = this.getCurPage();
        const prevPage = this.prevPage;
        let pageWeight = this.pageWeightForChrome;
        if (curPage > prevPage) {
          pageWeight = Math.min(pageWeight + (curPage - prevPage), CURSE);
          if (this.pageOverflowForChrome) {
            this._pageOverflowForChrome = pageWeight < CURSE;
          }
        } else if (curPage < prevPage) {
          pageWeight = Math.max(pageWeight - (prevPage - curPage), 0);
          if (this.pageOverflowForChrome) {
            this._pageOverflowForChrome = pageWeight < CURSE;
          } else {
            // 3 페이지 이상 이전 페이지 이동했을 때
            this._pageOverflowForChrome = pageWeight === 0;
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

  moveToChunkId(chunkId) {
    this._movoTo(tts, 'ChunkId', chunkId);
  }

  static toast(message = '') {
    android.onShowToast(message, message.length > 20 ? 1 : 0);
  }
}

App.staticOverride(App, _App, ['toast']);
