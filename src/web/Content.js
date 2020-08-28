import NodeLocation from '../common/NodeLocation';
import Sel from './Sel';
import Util from '../common/Util';
import _Content from '../common/_Content';

const { Type } = NodeLocation;

/**
 * @class Content
 * @extends _Content
 */
export default class Content extends _Content {
  /**
   * @returns {Sel}
   * @private
   */
  _createSel() {
    return new Sel(this);
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
    };

    elements.forEach((element) => {
      if (element.complete) {
        processedList.push(element);
      } else {
        element.addEventListener('load', () => {
          processedList.push(element);
          tryReviseImages();
        });
        element.addEventListener('error', () => {
          processedList.push(null);
          tryReviseImages();
        });
      }
    });

    tryReviseImages();
  }

  /**
   * @param {Rect} rect
   * @returns {?number} one-based page number
   */
  getPageFromRect(rect) {
    if (rect === null) {
      return null;
    } else if (this._context.isScrollMode) {
      return Math.floor(rect.top / this._context.pageHeightUnit) + 1;
    }
    return Math.floor(rect.left / this._context.pageWidthUnit) + 1;
  }

  /**
   * anchor의 페이지를 구한다.
   * 페이지를 찾을 수 없을 경우 null을 반환한다.
   *
   * @param {string} anchor
   * @returns {?number} one-based page number
   */
  getPageFromAnchor(anchor) {
    return this._getOffsetFromAnchor(anchor, (rect, element) => {
      if (rect.left === null || rect.top === null) {
        return null;
      }
      return this.getPageFromRect(rect, element);
    });
  }

  /**
   * serializedRange(rangy.js 참고)의 페이지를 구한다.
   * 페이지를 찾을 수 없을 경우 null을 반환한다.
   *
   * @param {string} serializedRange
   * @returns {?number} one-based page number
   */
  getPageFromSerializedRange(serializedRange) {
    const offset = this.getOffsetFromSerializedRange(serializedRange);
    const { isScrollMode, pageHeightUnit } = this._context;
    if (isScrollMode && offset !== null) {
      return Math.floor(offset / pageHeightUnit) + 1;
    }
    return offset;
  }

  /**
   * NodeLocation의 페이지를 구한다.
   * 페이지를 찾을 수 없을 경우 null을 반환한다.
   *
   * @param {string|NodeLocation} location
   * @param {string} type Type.TOP or Type.BOTTOM
   * @returns {?number} one-based page number
   */
  getPageFromNodeLocation(location, type = Type.TOP) {
    const offset = this.getOffsetFromNodeLocation(location, type);
    const { isScrollMode, pageHeightUnit } = this._context;
    if (isScrollMode && offset !== null) {
      return Math.floor(offset / pageHeightUnit) + 1;
    }
    return offset;
  }

  /**
   * @param {string} type Type.TOP or Type.BOTTOM
   * @returns {string}
   */
  getCurrentNodeLocation(type = Type.TOP) {
    const screenWidth = Util.getStylePropertyValue(document.documentElement, 'width');
    const contentWidth = Util.getStylePropertyValue(this._ref, 'width');
    const leftMargin = (screenWidth - contentWidth) / 2;

    const { isScrollMode, pageUnit } = this._context;
    const startOffset = this._reader.pageOffset + (isScrollMode ? 0 : leftMargin);
    const endOffset = startOffset + pageUnit;
    const notFound = new NodeLocation(-1, -1, type).toString();

    const location = this._findNodeLocation(startOffset, endOffset, type);
    this._reader._showNodeLocationIfDebug();
    if (!location) {
      return notFound;
    }

    return location;
  }
}