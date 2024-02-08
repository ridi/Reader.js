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
   * @param {HTMLImageElement} element
   * @param {number} screenWidth
   * @param {number} screenHeight
   * @returns {ImageSizeMatrix}
   */
  reviseImage(element, screenWidth, screenHeight) {
    const result = super.reviseImage(element, screenWidth, screenHeight);

    // Case 5. 부모에 의해 크기가 소멸한 경우
    // - Android 2.x~4.x에서 이미지 태그의 부모 중 h1~h5 태그가 있을 때 너비 또는 높이가 0으로 랜더링된 것을 보정 (ex: 852000033, 커버)
    const { renderSize } = result.matrix;
    if (renderSize.width === 0 || renderSize.height === 0) {
      let target = element.parentElement;
      do {
        if (target.nodeName.match(/^H[0-9]$/i)) {
          result.position = 'absolute';
          break;
        }
      } while ((target = target.parentElement));
      result.logger(5);
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

  fixColumnCollapseIssue(padding) {
    // Chromium 86~89 with LayoutNG Fragment enabled.
    // - 마지막 문장이 유실되는 문제
    // Chromium 117 ~
    // - body padding이 문시되는 문제 (두쪽 보기가 홀수로 떨어지는 경우 우측을 빈 페이지로 만들기 위한 패딩이 일부 무시됨)
    const id = 'LayoutNG-last-sentence-missing-or-body-padding-ignored-error-workaround';
    let div = document.getElementById(id);
    if (!div) {
      div = document.createElement('div');
      div.setAttribute('id', id);
      div.setAttribute('style', `height: ${padding}px;`);
      document.body.appendChild(div);
    }
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
