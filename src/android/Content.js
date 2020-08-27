import NodeLocation from '../common/NodeLocation';
import Sel from './Sel';
import SpeechHelper from './SpeechHelper';
import Util from '../common/Util';
import _Content from '../common/_Content';

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
    const results = [];

    this.images.forEach((element) => {
      const { width, height, position } = this._reviseImage(element, baseWidth, baseHeight);
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

    if (callback) {
      setTimeout(() => {
        callback();
      }, 0);
    }
  }

  /**
   * @param {HTMLImageElement} element
   * @param {number} baseWidth
   * @param {number} baseHeight
   * @returns {Image}
   * @private
   */
  _reviseImage(element, baseWidth, baseHeight) {
    const result = super._reviseImage(element, baseWidth, baseHeight);

    //
    // * 부모에 의한 크기 소멸 보정.
    //   - Android 2.x~4.x에서 이미지 태그의 부모 중 h1~h5 태그가 있을 때
    //    너비 또는 높이가 0으로 랜더링되는 현상을 방지한다.
    //    (해당 증상이 발생하는 bookId=852000033, 커버 이미지)
    //

    if (result.size.dWidth === 0 || result.size.dHeight === 0) {
      let target = element.parentElement;
      do {
        if (target.nodeName.match(/^H[0-9]$/i)) {
          result.position = 'absolute';
          break;
        }
      } while ((target = target.parentElement));
    }

    return result;
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

    const { pageWidthUnit, pageHeightUnit } = this._context;

    const direction = this._getOffsetDirectionFromElement(element);
    const origin = rect[direction];
    const pageUnit = direction === 'left' ? pageWidthUnit : pageHeightUnit;
    const offset = origin / pageUnit;
    const fOffset = Math.floor(offset);

    if (this._reader.calcPageForDoublePageMode) {
      const rOffset = Math.round(offset);
      if (fOffset === rOffset) {
        return fOffset;
      }
      return rOffset - 0.5;
    }

    return fOffset;
  }

  /**
   * @param {string} id
   */
  findRectFromElementId(id) {
    const rect = this.getRectFromElementId(id);
    if (rect) {
      const { left, top, width, height } = rect.toAbsolute();
      android.onElementRectFound(left, top, width, height);
    } else {
      android.onElementRectNotFound();
    }
  }

  /**
   * @param {string} type Type.Top or Type.BOTTOM
   */
  getCurrentNodeLocation(type = NodeLocation.Type.TOP) {
    const startOffset = this._reader.pageOffset;
    const endOffset = startOffset + this._context.pageUnit;

    const location = this._findNodeLocation(startOffset, endOffset, type);
    this._reader._showNodeLocationIfDebug();
    if (!location) {
      android.onNodeLocationOfCurrentPageNotFound();
      return;
    }

    android.onNodeLocationOfCurrentPageFound(location.toString());
  }

  /**
   * @param {number} index
   * @param {string} serializedRange
   */
  getRectListFromSerializedRange(index, serializedRange) {
    const rectList = super.getRectListFromSerializedRange(serializedRange);
    android.onRectListOfSerializedRange(index, serializedRange, rectList.toJsonString());
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

        const { context, pageYOffset, curPage } = this._reader;

        const footnoteType = type === 'noteref' ? 3.0 : 2.0;
        const text = link.node.textContent || '';
        let canUseFootnote = href.match(/^file:\/\//gm) !== null &&
          (text.trim().match(Util.getFootnoteRegex()) !== null || footnoteType >= 3.0);

        if (canUseFootnote) {
          const src = href.replace(window.location.href, '');
          if (src[0] === '#' || src.match(this._src) !== null) {
            const anchor = src.substring(src.lastIndexOf('#') + 1);
            const offset = this.getOffsetFromAnchor(anchor);
            if (context.isScrollMode) {
              canUseFootnote = offset >= pageYOffset;
            } else {
              canUseFootnote = offset >= curPage;
            }
          }
        }

        const rectListString = range.getClientRects().toRectList().trim().toAbsolute().toJsonString();
        android.onLinkPressed(href, rectListString, canUseFootnote, footnoteType >= 3.0 ? text : null);
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
    if (src) {
      android.onImageLongTapZoom(src);
    }

    src = this.svgHtmlFromPoint(x, y);
    if (src) {
      android.onSvgElementLongTapZoom(src);
    }
  }

  /**
   * @param {*} args
   * @private
   */
  _moveTo(...args) {
    const method = args[0];
    if (this._context.isScrollMode) {
      const scrollY = this[`getOffsetFrom${method}`](args[1]);
      if (scrollY !== null) {
        android[`onScrollYOffsetOf${method}Found`](android.dipToPixel(scrollY));
        return;
      }
    } else {
      const page = this[`getOffsetFrom${method}`](args[1]);
      if (page !== null) {
        android[`onPageOffsetOf${method}Found`](page);
        return;
      }
    }
    android[`on${method}NotFound`]();
  }

  /**
   * @param {string} anchor
   */
  moveToAnchor(anchor) {
    this._moveTo('Anchor', anchor);
  }

  /**
   * @param {string} serializedRange
   */
  moveToSerializedRange(serializedRange) {
    this._moveTo('SerializedRange', serializedRange);
  }

  /**
   * @param {string} location
   */
  moveToNodeLocation(location) {
    this._moveTo('NodeLocation', location);
  }
}
