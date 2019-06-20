import _Content from '../common/_Content';
import Sel from './Sel';
import Util from '../common/Util';

const RIDI_SCHEME = 'ridi+epub://';

/**
 * @class Content
 * @extends _Content
 * @property {boolean} isImagesRevised
 */
export default class Content extends _Content {
  /**
   * @param {HTMLElement} element
   * @param {Reader} reader
   */
  constructor(element, reader) {
    super(element, reader);
    this.isImagesRevised = false;
  }

  /**
   * @returns {Sel}
   * @private
   */
  _createSel() {
    return new Sel(this._reader);
  }

  /**
   * @param {number} screenWidth
   * @param {number} screenHeight
   */
  reviseImages(screenWidth, screenHeight) {
    const processedList = [];
    const elements = this.images;
    const tryReviseImages = () => {
      if (elements.length === processedList.length) {
        const results = [];
        processedList.forEach((element) => {
          const { width, height, position } = this._reviseImage(element, screenWidth, screenHeight);
          if (width.length || height.length || position.length) {
            results.push({ element, width, height, position });
          }
        });

        //
        // * 보정된 스타일 반영.
        //
        results.forEach((result) => {
          const { element, width, height, position } = result;
          if (width.length) {
            element.style.width = width;
          }
          if (height.length) {
            element.style.height = height;
          }
          if (position.length) {
            element.style.position = position;
          }
        });
        this.isImagesRevised = true;
      }
    };

    this.isImagesRevised = false;

    elements.forEach((element) => {
      if (element.complete) {
        processedList.push(element);
      } else {
        element.setAttribute('src', `${element.getAttribute('src')}?stamp=${Math.random()}`);
        element.addEventListener('load', () => { // 이미지 로드 완료
          processedList.push(element);
          tryReviseImages();
        });
        element.addEventListener('error', () => { // 이미지 로드 실패
          processedList.push(null);
          tryReviseImages();
        });
      }
    });

    tryReviseImages();
  }

  /**
   * @param {Rect} rect
   * @param {HTMLElement} element
   * @returns {?number}
   */
  getPageFromRect(rect, element) {
    if (rect === null) {
      return null;
    }

    const { pageOffset } = this._reader;
    const { pageWidthUnit, pageHeightUnit, isScrollMode } = this._context;

    const direction = this._getOffsetDirectionFromElement(element);
    const pageUnit = direction === 'left' ? pageWidthUnit : pageHeightUnit;
    let page = Math.floor((rect[direction] + pageOffset) / pageUnit);

    if (!isScrollMode && rect.top < 0) {
      page += Math.floor(rect.top / pageHeightUnit);
    }

    return page;
  }

  /**
   * @param {string} type (top or bottom)
   * @returns {string}
   */
  getNodeLocationOfCurrentPage(type = 'top') {
    const startOffset = 0;
    const endOffset = this._context.pageUnit;
    const notFound = `-1${Content.NodeLocation.INDEX_SEPARATOR}-1`;

    // 앱이 백그라운드 상태일 때는 계산하지 않는다.
    // (백그라운드 상태에서는 scrollLeft 값을 신뢰할 수 없기 때문)
    if (this._reader.isInBackground) {
      return notFound;
    }

    const location = this._findNodeLocation(startOffset, endOffset, type);
    this.showNodeLocationIfDebug();
    if (!location) {
      return notFound;
    }

    return location;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} rawX
   * @param {number} rawY
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   * @param {boolean} isVerticalPagingOn
   */
  onSingleTapEvent(x, y, rawX, rawY, canvasWidth, canvasHeight, isVerticalPagingOn) {
    const baseUrl = `${RIDI_SCHEME}navigation/`;
    const { location } = window;
    const link = this.linkFromPoint(x, y);
    if (link !== null) {
      const href = link.href || '';
      const type = link.type || '';
      if (href.length) {
        const range = document.createRange();
        range.selectNodeContents(link.node);

        const rectListCoord = this._reader.rectsToAbsolute(range.getClientRects()).trim().toCoord();
        const footnoteType = type === 'noteref' ? 3.0 : 2.0;
        const text = link.node.textContent || '';
        const canUseFootnote = href.match(/^file:\/\//gm) !== null &&
          (text.trim().match(Util.getFootnoteRegex()) !== null || footnoteType >= 3.0);
        const payload = {
          link: encodeURIComponent(href),
          rectListCoord,
          canUseFootnote,
          rawX,
          rawY,
        };
        if (footnoteType >= 3.0) {
          payload.title = encodeURIComponent(text);
        }
        location.href = `${baseUrl}anchor?${JSON.stringify(payload)}`;

        return;
      }
    }

    if (!this._context.isScrollMode) {
      if (isVerticalPagingOn) {
        if (rawY < canvasHeight / 3) {
          location.href = `${baseUrl}viewPageByTopOrLeftTouch`;
          return;
        } else if (rawY > (canvasHeight * 2) / 3) {
          location.href = `${baseUrl}viewPageByBottomOrRightTouch`;
          return;
        }
      } else if (rawX < canvasWidth / 4) {
        location.href = `${baseUrl}viewPageByTopOrLeftTouch`;
        return;
      } else if (rawX > (canvasWidth * 3) / 4) {
        location.href = `${baseUrl}viewPageByBottomOrRightTouch`;
        return;
      }
    }
    location.href = `${baseUrl}toggleFullscreen`;
  }
}
