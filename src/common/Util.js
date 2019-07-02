const { SHOW_TEXT, FILTER_ACCEPT, FILTER_SKIP } = NodeFilter;

/**
 * @class Util
 */
export default class Util {
  /**
   * @param {Node} root
   * @param {function} filter
   * @returns {NodeIterator}
   */
  static createTextNodeIterator(root, filter = () => true) {
    return document.createNodeIterator(root, SHOW_TEXT, {
      acceptNode(node) {
        return filter(node) ? FILTER_ACCEPT : FILTER_SKIP;
      },
    }, true);
  }

  /**
   * @param {Node} root
   * @param {number} whatToShow
   * @param {function} filter
   * @param {boolean} entityReferenceExpansion
   * @returns {NodeIterator}
   */
  static createNodeIterator(root, whatToShow, filter = () => true, entityReferenceExpansion = false) {
    return document.createNodeIterator(root, whatToShow, {
      acceptNode(node) {
        return filter(node) ? FILTER_ACCEPT : FILTER_SKIP;
      },
    }, entityReferenceExpansion);
  }

  /**
   * @returns {RegExp}
   */
  static getFootnoteRegex() {
    // 이 곳을 수정했다면 네이티브 코드도 수정해야 한다.
    return /^(\[|\{|\(|주|)[0-9].*(\)|\}|\]|\.|)$/gm;
  }

  /**
   * @returns {RegExp}
   */
  static getSplitWordRegex() {
    // 주의! NodeLocation의 wordIndex에 영향을 주는 부분으로 함부로 수정하지 말것.
    return new RegExp(' |\\u00A0');
  }

  /**
   * @typedef {object} ImageSize
   * @property {number} dWidth
   * @property {number} dHeight
   * @property {number} nWidth
   * @property {number} nHeight
   * @property {number} sWidth
   * @property {number} sHeight
   * @property {number} aWidth
   * @property {number} aHeight
   */
  /**
   * @param {HTMLImageElement} element
   * @returns {ImageSize}
   */
  static getImageSize(element) {
    const attrs = element.attributes;
    const zeroAttr = document.createAttribute('size');
    zeroAttr.value = '0px';

    return {
      // 화면에 맞춰 랜더링된 크기
      dWidth: element.width,
      dHeight: element.height,
      // 원본 크기
      nWidth: element.naturalWidth,
      nHeight: element.naturalHeight,
      // CSS에서 명시된 크기
      sWidth: Util.getMatchedCSSValue(element, 'width'),
      sHeight: Util.getMatchedCSSValue(element, 'height'),
      // 엘리먼트 속성으로 명시된 크기
      aWidth: (attrs.width || zeroAttr).value,
      aHeight: (attrs.height || zeroAttr).value,
    };
  }

  /**
   * @param {Node} target
   * @param {string} property
   * @returns {number}
   */
  static getStylePropertyValue(target, property) {
    let style = target;
    if (target.nodeType) {
      style = window.getComputedStyle(target);
    }
    return parseFloat(style[property]) || 0;
  }

  /**
   * @param {Node} target
   * @param {string[]} properties
   * @returns {number}
   */
  static getStylePropertyValues(target, properties) {
    let style = target;
    if (target.nodeType) {
      style = window.getComputedStyle(target);
    }
    let value = 0;
    for (let i = 0; i < properties.length; i += 1) {
      value += (parseInt(style[properties[i]], 10) || 0);
    }
    return value;
  }

  /**
   * @param {HTMLElement} element
   * @param {string} property
   * @returns {string}
   * @private
   */
  static _getMatchedCSSValue(element, property) {
    // element property has highest priority
    let val = element.style.getPropertyValue(property);

    // if it's important, we are done
    if (element.style.getPropertyPriority(property)) {
      return val;
    }

    // get matched rules
    const rules = window.getMatchedCSSRules(element);
    if (rules === null) {
      return val;
    }

    // iterate the rules backwards
    // rules are ordered by priority, highest last
    for (let i = rules.length - 1; i >= 0; i -= 1) {
      const rule = rules[i];
      const important = rule.style.getPropertyPriority(property);

      // if set, only reset if important
      if (val === null || val.length === 0 || important) {
        val = rule.style.getPropertyValue(property);

        // done if important
        if (important) {
          break;
        }
      }
    }

    return val;
  }

  /**
   * @param {HTMLElement} element
   * @param {string} property
   * @param {boolean} recursive
   * @returns {?string}
   */
  static getMatchedCSSValue(element, property, recursive = false) {
    let val;
    while (!(val = this._getMatchedCSSValue(element, property))) {
      element = element.parentElement;
      if (element === null || !recursive) {
        break;
      }
    }

    return val;
  }
}
