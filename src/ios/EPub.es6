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

  static scrollTo(offset = 0) {
    // offset이 maxOffset을 넘길 수 없도록 보정한다. 이게 필요한 이유는 아래와 같다.
    // - 보기 설정 미리보기를 보여주는 중에 마지막 페이지보다 뒤로 이동해 빈 페이지가 보이는 것을 방지
    let adjustOffset = offset;
    if (app.scrollMode) {
      const height = app.pageHeightUnit;
      const maxOffset = this.getTotalHeight() - height;
      adjustOffset = Math.min(adjustOffset, maxOffset);
    } else {
      const width = app.pageWidthUnit;
      const maxPage = Math.max(Math.ceil(this.getTotalWidth() / width) - 1, 0);
      adjustOffset = Math.min(adjustOffset, maxPage * width);
    }

    super.scrollTo(adjustOffset);
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

  static getNodeLocationOfCurrentPage(posSeparator) {
    const startOffset = 0;
    const endOffset = app.pageUnit;
    const notFound = `-1${posSeparator}-1`;

    // 앱이 백그라운드 상태일 때는 계산하지 않는다.
    // (백그라운드 상태에서는 scrollLeft 값을 신뢰할 수 없기 때문)
    if (app.isBackground()) {
      return notFound;
    }

    const location = this.findNodeLocation(startOffset, endOffset, 'top', posSeparator);
    this.showNodeLocationIfNeeded();
    if (!location) {
      return notFound;
    }

    return location;
  }

  static reviseImagesInSpine() {
    const elList = [];
    const els = document.images;
    const tryReviseImages = () => {
      if (els.length === elList.length) {
        const results = [];
        elList.forEach((el) => {
          const result = this.reviseImage(el, app.pageWidthUnit, app.pageHeightUnit);
          if (result.width.length || result.height.length || result.position.length) {
            results.push({
              el,
              width: result.width,
              height: result.height,
              position: result.position,
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

  static isImagesRevised() {
    return onImagesRevise;
  }
}

EPub.staticOverride(EPub, _EPub, ['getPageOffsetFromRect']);
