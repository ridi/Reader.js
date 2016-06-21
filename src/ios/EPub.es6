import _EPub from '../common/_EPub';

let onImagesRevise = false;

export default class EPub extends _EPub {
  static setViewport() {
    const value = `width=${window.innerWidth}, height=${window.innerHeight}, ` +
                  'initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=0';
    let viewport = document.querySelector('meta[name=viewport]');
    if (viewport === null) {
      viewport = document.createElement('meta');
      viewport.id = 'viewport';
      viewport.name = 'viewport';
      document.getElementsByTagName('head')[0].appendChild(viewport);
    }
    viewport.content = value;
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

    return Math.floor(origin / app.pageUnit);
  }

  static getTopNodeLocationOfCurrentPage(posSeparator) {
    const pageUnit = app.pageUnit;
    const startOffset = 0;
    const endOffset = pageUnit;
    const notFound = `-1${posSeparator}-1`;

    // 앱이 백그라운드 상태일 때는 계산하지 않는다.
    // (백그라운드 상태에서는 scrollLeft 값을 신뢰할 수 없기 때문)
    if (app.isBackground()) {
      return notFound;
    }

    if (startOffset === endOffset) {
      return notFound;
    }

    const result =
      this.findTopNodeRectAndLocationOfCurrentPage(startOffset, endOffset, posSeparator);
    if (!result) {
      return notFound;
    }

    this.showTopNodeLocation(result);

    return result.location;
  }

  static getScrollYOffsetFromTopNodeLocation(nodeIndex, wordIndex) {
    let scrollYOffset = super.getScrollYOffsetFromTopNodeLocation(nodeIndex, wordIndex);
    if (scrollYOffset !== null) {
      scrollYOffset += window.pageYOffset;
    }
    return scrollYOffset;
  }

  static reviseImagesInSpine() {
    let paddingTop = 0;
    const elList = [];
    const els = document.images;
    const tryReviseImages = () => {
      if (els.length === elList.length) {
        const results = [];
        elList.forEach((el) => {
          const result =
            this.reviseImage(el, app.pageWidthUnit, app.pageHeightUnit, paddingTop);
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
        });

        //
        // * 보정된 스타일 반영.
        //
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
        onImagesRevise = true;
      }
    };

    onImagesRevise = false;

    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (el.complete) {
        elList.push(el);
      } else {
        if (app.systemMajorVersion >= 8) {
          el.setAttribute('src', `${el.getAttribute('src')}?stamp=${Math.random()}`);
        }
        el.addEventListener('load', () => { // 이미지 로드 완료
          elList.push(el);
          tryReviseImages();
        });
        el.addEventListener('error', () => { // 이미지 로드 실패
          elList.push(null);
          tryReviseImages();
        });
      }
    }

    tryReviseImages();
  }

  static onImagesRevise() {
    return onImagesRevise;
  }
}

EPub.staticOverride(EPub, _EPub, ['getPageOffsetFromRect']);
