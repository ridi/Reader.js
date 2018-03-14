import _Object from './_Object';

export default class _Util extends _Object {
  /**
   * @param {Node} node
   * @returns {NodeIterator}
   */
  static createTextNodeIterator(node) {
    return document.createNodeIterator(node, NodeFilter.SHOW_TEXT, { acceptNode() { return NodeFilter.FILTER_ACCEPT; } }, true);
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
   * @param {Node} imgEl
   * @returns {{dWidth: *, dHeight: *, nWidth: number, nHeight: number, sWidth: *, sHeight: *, aWidth: string, aHeight: string}}
   */
  static getImageSize(imgEl) {
    const attrs = imgEl.attributes;
    const zeroAttr = document.createAttribute('size');
    zeroAttr.value = '0px';

    return {
      // 화면에 맞춰 랜더링된 크기
      dWidth: imgEl.width,
      dHeight: imgEl.height,
      // 원본 크기
      nWidth: imgEl.naturalWidth,
      nHeight: imgEl.naturalHeight,
      // CSS에서 명시된 크기
      sWidth: _Util.getMatchedCSSValue(imgEl, 'width'),
      sHeight: _Util.getMatchedCSSValue(imgEl, 'height'),
      // 엘리먼트 속성으로 명시된 크기
      aWidth: (attrs.width || zeroAttr).value,
      aHeight: (attrs.height || zeroAttr).value,
    };
  }

  /**
   * @param {Node} target
   * @param {String} property
   * @returns {Number}
   */
  static getStylePropertyIntValue(target, property) {
    let style = target;
    if (target.nodeType) {
      style = window.getComputedStyle(target);
    }
    return parseInt(style[property], 10) || 0;
  }

  /**
   * @param {Node} target
   * @param {String[]} properties
   * @returns {Number}
   */
  static getStylePropertiesIntValue(target, properties) {
    let style = target;
    if (target.nodeType) {
      style = window.getComputedStyle(target);
    }
    let value = 0;
    for (let i = 0; i < properties.length; i++) {
      value += (parseInt(style[properties[i]], 10) || 0);
    }
    return value;
  }

  /**
   * @param {Node} el
   * @param {String} property
   * @returns {String}
   * @private
   */
  static _getMatchedCSSValue(el, property) {
    // element property has highest priority
    let val = el.style.getPropertyValue(property);

    // if it's important, we are done
    if (el.style.getPropertyPriority(property)) {
      return val;
    }

    // get matched rules
    const rules = window.getMatchedCSSRules(el);
    if (rules === null) {
      return val;
    }

    // iterate the rules backwards
    // rules are ordered by priority, highest last
    for (let i = rules.length - 1; i >= 0; i--) {
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
   * @param {Node} el
   * @param {String} property
   * @param {Boolean} recursive
   * @returns {String|null}
   */
  static getMatchedCSSValue(el, property, recursive = false) {
    let val;
    let target = el;
    while (!(val = this._getMatchedCSSValue(target, property))) {
      target = target.parentElement;
      if (target === null || !recursive) {
        break;
      }
    }

    return val;
  }

  /**
   * @param {MutableClientRect[]} array
   * @param {MutableClientRect[]} rects
   * @param {function} adjust
   * @returns {MutableClientRect[]}
   */
  static concatArray(array, rects, adjust = rect => rect) {
    for (let i = 0; i < rects.length; i++) {
      array.push(adjust(rects[i]));
    }
    return array;
  }
}
