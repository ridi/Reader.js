import _Content from '../common/_Content';
import NodeLocation from '../common/NodeLocation';
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
   * @param {?HTMLElement} element
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
   * @param {string} type Type.TOP or Type.BOTTOM
   * @returns {NodeLocation}
   */
  getCurrentNodeLocation(type = NodeLocation.Type.TOP) {
    const startOffset = 0;
    const endOffset = this._context.pageUnit;
    const notFound = new NodeLocation(-1, -1, type);

    const location = this._findNodeLocation(startOffset, endOffset, type);
    this._reader._showNodeLocationIfDebug();
    if (!location) {
      return notFound;
    }

    return location;
  }
}
