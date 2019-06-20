import _Content from '../common/_Content';
import Sel from './Sel';
import Util from '../common/Util';

/**
 * @class Content
 * @extends _Content
 * @private @property {string} _src
 */
export default class Content extends _Content {
  /**
   * @param {HTMLElement} element
   * @param {string} src
   * @param {Reader} reader
   */
  constructor(element, src, reader) {
    super(element, reader);
    this._src = src;
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
    const results = [];

    this.images.forEach((element) => {
      const { width, height, position } = this._reviseImage(element, screenWidth, screenHeight);
      if (width.length || height.length || position.length) {
        results.push({ element, width, height, position });
      }
    });

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
  }

  /**
   * @param {HTMLImageElement} element
   * @param {number} screenWidth
   * @param {number} screenHeight
   * @returns {Image}
   * @private
   */
  _reviseImage(element, screenWidth, screenHeight) {
    const result = super._reviseImage(element, screenWidth, screenHeight);

    //
    // * 부모에 의한 크기 소멸 보정.
    //   - Android 2.x~4.x에서 이미지 태그의 부모 중 h1~h5 태그가 있을 때
    //    너비 또는 높이가 0으로 랜더링되는 현상을 방지한다.
    //    (해당 증상이 발생하는 bookId=852000033, 커버 이미지)
    //

    if (result.size.dWidth === 0 || result.size.dHeight === 0) {
      let target = element.parentElement;
      do {
        if (target.nodeName.match(/H[0-9]/)) {
          result.position = 'absolute';
          break;
        }
      } while ((target = target.parentElement));
    }

    return result;
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

    const { calcPageForDoublePageMode, pageOffset } = this._reader;
    const { pageWidthUnit, pageHeightUnit } = this._context;

    const direction = this._getOffsetDirectionFromElement(element);
    const origin = rect[direction] + pageOffset;
    const pageUnit = direction === 'left' ? pageWidthUnit : pageHeightUnit;
    const offset = origin / pageUnit;
    const fOffset = Math.floor(offset);

    if (calcPageForDoublePageMode) {
      const rOffset = Math.round(offset);
      if (fOffset === rOffset) {
        return fOffset;
      }
      return rOffset - 0.5;
    }

    return fOffset;
  }

  /**
   * @param {string} type (top or bottom)
   */
  getNodeLocationOfCurrentPage(type = 'top') {
    const startOffset = 0;
    const endOffset = this._context.pageUnit;

    const location = this._findNodeLocation(startOffset, endOffset, type);
    this.showNodeLocationIfDebug();
    if (!location) {
      android.onNodeLocationOfCurrentPageNotFound();
      return;
    }

    android.onNodeLocationOfCurrentPageFound(location);
  }

  /**
   * @param {number} index
   * @param {string} serializedRange
   */
  getRectListFromSerializedRange(index, serializedRange) {
    const rectList = super.getRectListFromSerializedRange(serializedRange);
    const rectListCoord = this._reader.rectsToAbsolute(rectList).toCoord();
    android.onRectListOfSerializedRange(index, serializedRange, rectListCoord);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {string} nativePoints
   */
  onSingleTapEvent(x, y, nativePoints) {
    const link = this.linkFromPoint(x, y);
    if (link !== null) {
      const href = link.href || '';
      const type = link.type || '';
      if (href.length) {
        const range = document.createRange();
        range.selectNodeContents(link.node);

        const { context, pageYOffset, curPage, rectsToAbsolute } = this._reader;

        const rectListCoord = rectsToAbsolute(range.getClientRects()).trim().toCoord();
        const footnoteType = type === 'noteref' ? 3.0 : 2.0;
        const text = link.node.textContent || '';
        let canUseFootnote = href.match(/^file:\/\//gm) !== null &&
          (text.trim().match(Util.getFootnoteRegex()) !== null || footnoteType >= 3.0);

        if (canUseFootnote) {
          const src = href.replace(window.location.href, '');
          if (src[0] === '#' || src.match(this._src) !== null) {
            const anchor = src.substring(src.lastIndexOf('#') + 1);
            const offset = this._reader.getOffsetFromAnchor(anchor);
            if (context.isScrollMode) {
              canUseFootnote = offset >= pageYOffset;
            } else {
              canUseFootnote = offset >= curPage;
            }
          }
        }

        android.onLinkPressed(href, rectListCoord, canUseFootnote, footnoteType >= 3.0 ? text : null);
        return;
      }
    }
    android.onSingleTapEventNotProcessed(nativePoints);
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  onLongTapZoomEvent(x, y) {
    let src = this.imagePathFromPoint(x, y);
    if (src !== 'null') {
      android.onImageLongTapZoom(src);
    }

    src = this.svgHtmlFromPoint(x, y);
    if (src !== 'null') {
      android.onSvgElementLongTapZoom(src);
    }
  }
}