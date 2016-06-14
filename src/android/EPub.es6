import _EPub from '../common/_EPub';
import Util from './Util';

let scrollTimer = null;

export default class EPub extends _EPub {
  static applyColumnProperty(width, gap) {
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

    const version = app.chromeMajorVersion;
    if (version < 48 && version >= 45) {
      // Chrome 45 버전부터 epub.totalWidth() 값을 신뢰할 수 없게 되었다
      const bodyComputedStyle = window.getComputedStyle(document.body);
      const bodyHeight = parseFloat(bodyComputedStyle.height, 10);
      let pageCount = bodyHeight / app.pageHeightUnit;
      if (app.doublePageMode) {
        pageCount /= 2;
      }
      return Math.ceil(pageCount);
    }
    return Math.ceil(totalWidth / app.pageWidthUnit);
  }

  static _easeInOut(currentTime, start, change, duration) {
    let time = currentTime;
    time /= duration / 2;
    if (time < 1) {
      return change / 2 * time * time + start;
    }
    time--;
    return -change / 2 * (time * (time - 2) - 1) + start;
  }

  static scrollTo(offset, animated, finalPageInSpine) {
    let adjustOffset = offset;
    if (app.scrollMode) {
      // 네이티브의 getContentHeight 값을 신뢰할 수 없어서 paddingBottom에 대한 보정은 여기서 한다
      const height = app.pageHeightUnit;
      const paddingBottom = Util.getStylePropertyIntValue(document.body, 'padding-bottom');
      const maxOffset = this.getTotalHeight() - height - paddingBottom;
      if (finalPageInSpine) {
        adjustOffset = maxOffset;
      }
      adjustOffset = Math.min(adjustOffset, maxOffset);
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
    let paddingTop = 0;

    const els = document.images;
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const result = super.reviseImage(el, canvasWidth, canvasHeight, paddingTop);
      if (result.width.length || result.height.length ||
        result.maxWidth.length || result.maxHeight.length || result.position.length) {
        paddingTop += result.paddingTop;
        results.push({
          el,
          width: result.width,
          height: result.height,
          maxWidth: result.maxWidth,
          maxHeight: result.maxHeight,
          position: result.position
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
      if (result.maxWidth.length) {
        el.style.maxWidth = result.maxWidth;
      }
      if (result.maxHeight.length) {
        el.style.maxHeight = result.maxHeight;
      }
      if (result.position.length) {
        el.style.position = result.position;
      }
    });
  }

  static reviseImage(imgEl, canvasWidth, canvasHeight, paddingTop) {
    const result = super.reviseImage(imgEl, canvasWidth, canvasHeight, paddingTop);
    const size = result.size;

    //
    // * Chrome 39 관련 보정
    //   - CSS로 지정된 이미지의 크기가 화면 크기보다 크면 화면 너비에 맞춰 비율을 유지하며 이미지 크기를 조절해 주는데
    //     39 이상부터 비율을 유지해주지 않고 너비만 화면에 맞춰주는 현상이 있어 이미지 보정에 오작동을 야기시키고 있다
    //     그래서 모든 스타일이 반영된 이미지 크기가 화면 크기보다 크면 랜더링된 이미지 크기를 화면 크기로 바꿔서
    //     오작동이 일어나지 않도록 우회시켜주고 있다
    //

    if (app.chromeMajorVersion >= 39) {
      const _sWidth = Util.getStylePropertyIntValue(imgEl, 'width');
      const _sHeight = Util.getStylePropertyIntValue(imgEl, 'height');
      const boundWidth = canvasWidth;
      let boundHeight = canvasHeight;
      if (_sWidth > boundWidth || _sHeight > boundHeight) {
        // img 태그에 들어간 lineHeight을 없애줘야 스파인 하나에 이미지 하나 있는 아이가 두 페이지로 계산되는 일을 피할 수 있다
        boundHeight -= Util.getStylePropertyIntValue(imgEl, 'line-height');
        if (_sWidth > boundWidth) {
          size.dWidth = boundWidth;
          size.dHeight = Math.min(boundWidth / size.nWidth * size.nHeight, boundHeight);
        } else {
          size.dWidth = Math.min(boundHeight / size.nHeight * size.nWidth, boundWidth);
          size.dHeight = boundHeight;
        }
        result.width = `${size.dWidth}px`;
        result.height = `${size.dHeight}px`;
      }
    }

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

  static refreshStyle(style) {
    const styleElements = document.getElementsByTagName('style');
    const styleElement = styleElements[styleElements.length - 1];
    styleElement.innerHTML = style;
  }

  static preventOverPaging() {
    const pageUnit = app.scrollMode ? app.pageHeightUnit : app.pageWidthUnit;
    const totalLength = app.scrollMode ? this.getTotalHeight() : this.getTotalWidth();
    const pageOffset = app.scrollMode ? window.pageYOffset : window.pageXOffset;

    const bodyBottomMargin = Util.getStylePropertyIntValue(document.body, 'margin-bottom');
    const extraPages =
      bodyBottomMargin / (app.doublePageMode ? app.pageHeightUnit * 2 : app.pageHeightUnit);
    const totalPages = Math.max(Math.floor(totalLength / pageUnit) - extraPages, 0);

    if (totalPages < pageOffset / pageUnit) {
      this.scrollTo(totalPages * pageUnit);
    }
  }
}

EPub.staticOverride(EPub, _EPub, ['getPageOffsetFromRect']);
