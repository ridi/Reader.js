import _Content from '../common/_Content';
import Sel from './Sel';

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
    return new Sel(this._reader);
  }

  /**
   * @param {function} callback
   */
  reviseImages(callback) {
    const { pageWidthUnit, pageHeightUnit, pageGap } = this._context;
    const screenWidth = pageWidthUnit - pageGap;
    const screenHeight = pageHeightUnit;
    const processedList = [];
    const elements = this.images;

    const tryReviseImages = () => {
      if (elements.length === processedList.length) {
        const results = [];
        processedList.forEach((element) => {
          const { width, height, position } = this.reviseImage(element, screenWidth, screenHeight);
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
        callback();
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
   * @param {HTMLElement} element
   * @returns {?number}
   */
  getPageFromRect(rect, element) {
    if (rect === null) {
      return null;
    }

    const { pageOffset } = this._reader;
    const { pageWidthUnit, pageHeightUnit } = this._context;

    const direction = this._getOffsetDirectionFromElement(element);
    const origin = rect[direction] + pageOffset;
    const pageUnit = direction === 'left' ? pageWidthUnit : pageHeightUnit;
    return Math.floor(origin / pageUnit);
  }

  /**
   * @param {string} type (top or bottom)
   * @returns {string}
   */
  getNodeLocationOfCurrentPage(type = 'top') {
    const startOffset = 0;
    const endOffset = this._context.pageUnit;
    const notFound = `-1${Content.NodeLocation.INDEX_SEPARATOR}-1`;

    const location = this._findNodeLocation(startOffset, endOffset, type);
    this.showNodeLocationIfDebug();
    if (!location) {
      return notFound;
    }

    return location;
  }
}
