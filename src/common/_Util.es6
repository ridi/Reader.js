import _Object from './_Object';
import MutableClientRect from './MutableClientRect';

export default class _Util extends _Object {
  /**
   * @param {Node} node
   * @returns {NodeIterator}
   */
  static createTextNodeIterator(node) {
    return document.createNodeIterator(
      node, NodeFilter.SHOW_TEXT, { acceptNode() { return NodeFilter.FILTER_ACCEPT; } }, true,
    );
  }

  /**
   * @param {Node} target
   * @param {String} property
   * @returns {number}
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
   * @param {[String]} properties
   * @returns {number}
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
   * @param {string} property
   * @returns {string}
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
      if (val === null || important) {
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
   * @param {string} property
   * @param {boolean} recursive
   * @returns {string|null}
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
   * @param {TextRange} range
   * @returns {boolean}
   * @private
   */
  static _isWhiteSpaceRange(range) {
    return /^\s*$/.test(range.toString());
  }

  /**
   * @param {[MutableClientRect]} array
   * @param {[MutableClientRect]} rects
   * @param {function} adjust
   * @returns {[MutableClientRect]}
   */
  static concatArray(array, rects, adjust = rect => rect) {
    for (let i = 0; i < rects.length; i++) {
      array.push(adjust(rects[i]));
    }
    return array;
  }

  /**
   * @param {TextRange} range
   * @returns {[MutableClientRect]}
   */
  static getOnlyTextNodeRectsFromRange(range) {
    if (range.startContainer === range.endContainer) {
      const innerText = range.startContainer.innerText;
      if (innerText !== undefined && innerText.length === 0) {
        return [];
      }
      return range.getAdjustedClientRects();
    }

    const iterator = this.createTextNodeIterator(range.commonAncestorContainer);
    let textNodeRects = [];

    let workRange = document.createRange();
    workRange.setStart(range.startContainer, range.startOffset);
    workRange.setEnd(range.startContainer, range.startContainer.length);
    textNodeRects = this.concatArray(textNodeRects, workRange.getAdjustedClientRects());

    let node;
    while ((node = iterator.nextNode())) {
      // startContainer 노드보다 el이 앞에 있으면
      if (range.startContainer.compareDocumentPosition(node) === Node.DOCUMENT_POSITION_PRECEDING ||
        range.startContainer === node) {
        continue;
      }

      // endContainer 뒤로 넘어가면 멈춤
      if (range.endContainer.compareDocumentPosition(node) === Node.DOCUMENT_POSITION_FOLLOWING ||
        range.endContainer === node) {
        break;
      }

      workRange = document.createRange();
      workRange.selectNodeContents(node);
      if (this._isWhiteSpaceRange(workRange)) {
        continue;
      }

      textNodeRects = this.concatArray(textNodeRects, workRange.getAdjustedClientRects());
    }

    workRange = document.createRange();
    workRange.setStart(range.endContainer, 0);
    workRange.setEnd(range.endContainer, range.endOffset);
    if (!this._isWhiteSpaceRange(workRange)) {
      textNodeRects = this.concatArray(textNodeRects, workRange.getAdjustedClientRects());
    }

    return textNodeRects;
  }

  /**
   * @param {string} serializedRange
   * @returns {TextRange}
   */
  static getRangeFromSerializedRange(serializedRange) {
    const tmpRange = rangy.deserializeRange(serializedRange, document.body);
    const range = document.createRange();
    range.setStart(tmpRange.startContainer, tmpRange.startOffset);
    range.setEnd(tmpRange.endContainer, tmpRange.endOffset);
    tmpRange.detach();
    return range;
  }

  /**
   * @param {[MutableClientRect]} rects
   * @param {boolean} absolute
   * @returns {string}
   */
  static rectsToCoord(rects, absolute) {
    const insets = { left: 0, top: 0 };
    if (absolute) {
      if (app.scrollMode) {
        insets.top = window.pageYOffset;
      } else {
        insets.left = window.pageXOffset;
      }
    }

    let result = '';
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      result += `${(rect.left + insets.left)},`;
      result += `${(rect.top + insets.top)},`;
      result += `${rect.width},`;
      result += `${rect.height},`;
    }

    return result;
  }

  /**
   * @param {[MutableClientRect]} rects
   * @returns {string}
   */
  static rectsToAbsoluteCoord(rects) {
    return this.rectsToCoord(rects, true);
  }

  /**
   * @param {[MutableClientRect]} rects
   * @returns {string}
   */
  static rectsToRelativeCoord(rects) {
    return this.rectsToCoord(rects, false);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {{x: number, y: number}}
   */
  static adjustPoint(x, y) {
    return { x, y };
  }

  /**
   * @param {ClientRect} rect
   * @returns {MutableClientRect}
   */
  static adjustRect(rect) {
    return new MutableClientRect(rect);
  }

  /**
   * @param {[ClientRect]} rects
   * @returns {MutableClientRect[]}
   */
  static adjustRects(rects) {
    return this.concatArray([], rects, this.adjustRect);
  }
}

Range.prototype.originGetClientRects = Range.prototype.getClientRects;

function getClientRects() {
  const rects = this.originGetClientRects();
  if (rects === null) {
    return [];
  }

  const newRects = [];
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    if (rect.width <= 1) {
      // Webkit, Chrome 버전에 따라 다음 페이지의 첫 글자를 선택했을 때
      // 마지막 rect의 너비가 1 이하인 값이 들어오게 되는데 이게 오작동을
      // 발생시키는 요인이 되기 때문에 버린다.
      continue;
    }
    newRects.push(rect);
  }
  return newRects;
}

Range.prototype.getClientRects = getClientRects;

function getAdjustedBoundingClientRect() {
  const rect = this.getBoundingClientRect() || new MutableClientRect();
  return _Util.adjustRect(rect);
}

function getAdjustedClientRects() {
  const rects = this.getClientRects() || [];
  return _Util.adjustRects(rects);
}

Range.prototype.getAdjustedBoundingClientRect = getAdjustedBoundingClientRect;
Range.prototype.getAdjustedClientRects = getAdjustedClientRects;

HTMLElement.prototype.getAdjustedBoundingClientRect = getAdjustedBoundingClientRect;
HTMLElement.prototype.getAdjustedClientRects = getAdjustedClientRects;
