import _EPub from '../common/_EPub';
import Util from './Util';

let scrollTimer = null;

export default class EPub extends _EPub {
  static calcPageCount(columnWidth) {
    if (app.scrollMode) {
      return Math.round(this.getTotalHeight() / app.pageHeightUnit);
    }

    const totalWidth = this.getTotalWidth();
    if (totalWidth < columnWidth) {
      // 가끔 total width가 0으로 넘어오는 경우가 있다. (커버 페이지에서 이미지가 그려지기 전에 호출된다거나)
      // 젤리빈에서는 0이 아닌 getWidth()보다 작은 값이 나오는 경우가 확인되었으며 재요청시 정상값 들어옴.
      // (-1을 리턴하면 재요청을 진행하게됨)
      return -1;
    }

    if (app.chromeMajorVersion >= 45) {
      // Chrome 45 버전부터 epub.totalWidth() 값을 신뢰할 수 없게 되어 다단으로 나뉘어진 body의 높이로 페이지를 계산한다.
      const bodyComputedStyle = window.getComputedStyle(document.body);
      const bodyHeight = parseFloat(bodyComputedStyle.height, 10);
      let pageCount = bodyHeight / app.pageHeightUnit;
      if (app.doublePageMode) {
        pageCount /= 2;
      }
      return Math.max(Math.ceil(pageCount), 1);
    }
    return Math.ceil(totalWidth / app.pageWidthUnit);
  }

  static _easeInOut(currentTime, start, change, duration) {
    let time = currentTime;
    time /= duration / 2;
    if (time < 1) {
      return (((change / 2) * time) * time) + start;
    }
    time -= 1;
    return ((-change / 2) * ((time * (time - 2)) - 1)) + start;
  }

  static scrollTo(offset = 0, animated = false) {
    // offset이 maxOffset을 넘길 수 없도록 보정한다. 이게 필요한 이유는 아래와 같다.
    // - 스크롤 보기에서 잘못해서 paddingBottom 영역으로 이동해 다음 스파인으로 이동되는 것을 방지
    // - 보기 설정 미리보기를 보여주는 중에 마지막 페이지보다 뒤로 이동해 빈 페이지가 보이는 것을 방지
    // 네이티브에서 보정하지 않는 것은 WebView.getContentHeight 값을 신뢰할 수 없기 때문이다.
    let adjustOffset = offset;
    if (app.scrollMode) {
      const totalHeight = this.getTotalHeight();
      const height = app.pageHeightUnit;
      const paddingTop = Util.getStylePropertyIntValue(document.body, 'padding-top');
      const paddingBottom = Util.getStylePropertyIntValue(document.body, 'padding-bottom');
      const maxOffset = totalHeight - height - paddingBottom;
      const diff = maxOffset - adjustOffset;
      if (adjustOffset > paddingTop && diff < height && diff > 0) {
        adjustOffset = maxOffset;
      }
      adjustOffset = Math.min(adjustOffset, maxOffset);
    } else {
      const width = app.pageWidthUnit;
      const height = app.pageHeightUnit;
      const marginBottom = Util.getStylePropertyIntValue(document.body, 'margin-bottom');
      const extraPages = marginBottom / (app.doublePageMode ? height * 2 : height);
      const maxPage = Math.max(Math.ceil(this.getTotalWidth() / width) - 1 - extraPages, 0);
      adjustOffset = Math.min(adjustOffset, maxPage * width);
    }

    if (animated) {
      if (scrollTimer) {
        clearTimeout(scrollTimer);
        scrollTimer = null;
      }

      const start = app.scrollMode ? window.pageYOffset : window.pageXOffset;
      const change = adjustOffset - start;
      const increment = 20;
      const duration = 200;
      const animateScroll = (elapsedTime) => {
        const time = elapsedTime + increment;
        super.scrollTo(this._easeInOut(time, start, change, duration));
        if (time < duration) {
          scrollTimer = setTimeout(() => {
            animateScroll(time);
          }, increment);
        } else {
          scrollTimer = null;
        }
      };

      animateScroll(0);
    } else {
      super.scrollTo(adjustOffset);
    }
  }

  static getPageOffsetFromRect(rect, el) {
    if (rect === null) {
      return null;
    }

    const direction = this.getOffsetDirectionFromElement(el);
    let origin = rect[direction];
    if (app.scrollMode) {
      origin += window.pageYOffset;
    } else {
      origin += window.pageXOffset;
    }

    const pageUnit = direction === 'left' ? app.pageWidthUnit : app.pageHeightUnit;
    const offset = origin / pageUnit;
    const fOffset = Math.floor(offset);
    if (app.calcPageForDoublePageMode) {
      const rOffset = Math.round(offset);
      if (fOffset === rOffset) {
        return fOffset;
      }
      return rOffset - 0.5;
    }
    return fOffset;
  }

  static getScrollYOffsetFromAnchor(anchor) {
    let scrollYOffset = super.getScrollYOffsetFromAnchor(anchor);
    if (scrollYOffset !== null) {
      scrollYOffset += window.pageYOffset;
    }
    return scrollYOffset;
  }

  static getScrollYOffsetFromSerializedRange(serializedRange) {
    let scrollYOffset = super.getScrollYOffsetFromSerializedRange(serializedRange);
    if (scrollYOffset !== null) {
      scrollYOffset += window.pageYOffset;
    }
    return scrollYOffset;
  }

  static getTopNodeLocationOfCurrentPage(posSeparator) {
    const startOffset = 0;
    const endOffset = app.pageUnit;

    if (startOffset === endOffset) {
      android.onTopNodeLocationOfCurrentPageNotFound();
      return;
    }

    const result =
      this.findTopNodeRectAndLocationOfCurrentPage(startOffset, endOffset, posSeparator);
    if (!result) {
      android.onTopNodeLocationOfCurrentPageNotFound();
      return;
    }

    this.showTopNodeLocation(result);

    android.onTopNodeLocationOfCurrentPageFound(result.location);
  }

  static getScrollYOffsetFromTopNodeLocation(nodeIndex, wordIndex) {
    let scrollYOffset = super.getScrollYOffsetFromTopNodeLocation(nodeIndex, wordIndex);
    if (scrollYOffset !== null) {
      scrollYOffset += window.pageYOffset;
    }
    return scrollYOffset;
  }

  static reviseImagesInSpine(canvasWidth, canvasHeight) {
    const results = [];

    const els = document.images;
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const result = this.reviseImage(el, canvasWidth, canvasHeight);
      if (result.width.length || result.height.length || result.position.length) {
        results.push({
          el,
          width: result.width,
          height: result.height,
          position: result.position,
        });
      }
    }

    results.forEach((result) => {
      const el = result.el;
      if (result.width.length) {
        el.style.width = result.width;
      }
      if (result.height.length) {
        el.style.height = result.height;
      }
      if (result.position.length) {
        el.style.position = result.position;
      }
    });
  }

  static reviseImage(imgEl, canvasWidth, canvasHeight) {
    const result = super.reviseImage(imgEl, canvasWidth, canvasHeight);
    const size = result.size;

    //
    // * 부모에 의한 크기 소멸 보정.
    //   - Android 2.x~4.x에서 이미지 태그의 부모 중 h1~h5 태그가 있을 때
    //    너비 또는 높이가 0으로 랜더링되는 현상을 방지한다.
    //    (해당 증상이 발생하는 bookId=852000033, 커버 이미지)
    //

    if (size.dWidth === 0 || size.dHeight === 0) {
      let el = imgEl.parentElement;
      do {
        const nodeName = el.nodeName;
        if (nodeName.match(/H[0-9]/)) {
          result.position = 'absolute';
          break;
        }
      } while ((el = el.parentElement));
    }

    return result;
  }
}

EPub.staticOverride(EPub, _EPub, ['getPageOffsetFromRect']);
