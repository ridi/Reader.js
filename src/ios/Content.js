import NodeLocation from '../common/NodeLocation';
import Sel from './Sel';
import SpeechHelper from './SpeechHelper';
import Util from '../common/Util';
import _Content from '../common/_Content';

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
    return new Sel(this);
  }

  /**
   * @returns {SpeechHelper}
   * @private
   */
  _createSpeechHelper() {
    return new SpeechHelper(this);
  }

  /**
   * @param {function} callback
   */
  reviseImages(callback) {
    const { width: baseWidth, height: baseHeight } = this._context;
    const processedList = [];
    const elements = this.images;
    const tryReviseImages = () => {
      if (elements.length === processedList.length) {
        const results = [];
        processedList.forEach((element) => {
          const { width, height, position } = this._reviseImage(element, baseWidth, baseHeight);
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

        if (callback) {
          setTimeout(() => {
            callback();
          }, 0);
        }
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
   * @param {?HTMLElement} element
   * @returns {?number} zero-based page number
   */
  getPageFromRect(rect, element) {
    if (rect === null) {
      return null;
    }

    const { pageWidthUnit, pageHeightUnit, isScrollMode } = this._context;

    const direction = this._getOffsetDirectionFromElement(element);
    const pageUnit = direction === 'left' ? pageWidthUnit : pageHeightUnit;

    let page = Math.floor((rect[direction]) / pageUnit);
    if (!isScrollMode && rect.top < 0) {
      page += Math.floor(rect.top / pageHeightUnit);
    }

    return page;
  }

  /**
   * @param {string} type Type.TOP or Type.BOTTOM
   * @returns {string}
   */
  getCurrentNodeLocation(type = NodeLocation.Type.TOP) {
    const startOffset = this._reader.pageOffset;
    const endOffset = startOffset + this._context.pageUnit;
    const notFound = new NodeLocation(-1, -1, type).toString();

    const location = this._findNodeLocation(startOffset, endOffset, type);
    this._reader._showNodeLocationIfDebug();
    if (!location) {
      return notFound;
    }

    return location.toString();
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

        const rectList = range.getClientRects().toRectList().trim().toAbsolute().toArray();
        const footnoteType = type === 'noteref' ? 3.0 : 2.0;
        const text = link.node.textContent || '';
        const canUseFootnote = href.match(/^file:\/\//gm) !== null &&
          (text.trim().match(Util.getFootnoteRegex()) !== null || footnoteType >= 3.0);
        const payload = {
          link: encodeURIComponent(href),
          rects: rectList,
          canUseFootnote,
          rawOffset: [rawX, rawY],
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

  /**
   * @param {string} id
   * @returns {?Rect}
   */
  getRectFromElementId(id) {
    const rect = super.getRectFromElementId(id);
    if (rect) {
      return rect.toAbsolute();
    }
    return null;
  }
}
