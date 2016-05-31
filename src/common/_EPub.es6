import _Object from './_Object';
import _Util from './_Util';
import MutableClientRect from './MutableClientRect';

let debugTopNodeLocation = false;
let textAndImageNodes = null;

export default class _EPub extends _Object {
  static getTotalWidth() {
    return document.documentElement.scrollWidth;
  }

  static getTotalHeight() {
    return document.documentElement.scrollHeight;
  }

  static getTotalPageSize() {
    return app.scrollMode ? this.getTotalHeight() : this.getTotalWidth();
  }

  static scrollTo(offset) {
    if (app.scrollMode) {
      scroll(0, offset);
    } else {
      scroll(offset, 0);
    }
  }

  static getImagePathFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    return (el && el.nodeName === 'IMG') ? (el.src || 'null') : 'null';
  }

  static getSvgElementFromPoint(x, y) {
    let el = document.elementFromPoint(x, y);
    while (el && el.nodeName !== 'HTML' && el.nodeName !== 'BODY') {
      el = el.parentElement;
      if (el.nodeName === 'SVG') {
        let prefix = '<svg';

        const attributes = el.attributes;
        for (let i = 0; i < attributes.length; i++) {
          const attribute = attributes[i];
          prefix += ` ${attribute.nodeName}="${attribute.nodeValue}"`;
        }
        prefix += '>';

        // svg 객체는 innerHTML 을 사용할 수 없으므로 아래와 같이 바꿔준다.
        const svgEl = document.createElement('svgElement');
        const childNodes = el.childNodes;
        for (let j = 0; j < childNodes.length; j++) {
          svgEl.appendChild(childNodes[j].cloneNode(true));
        }

        return `${prefix}${svgEl.innerHTML}<\/svg>`;
      }
    }
    return 'null';
  }

  static getLinkFromElement(el) {
    let target = el;
    while (target) {
      if (target && target.nodeName === 'A') {
        return {
          node: target,
          href: target.href,
          type: (target.attributes['epub:type'] || { value: '' }).value,
        };
      }
      target = target.parentNode;
    }
    return null;
  }

  static getOffsetDirectionFromElement(el) {
    let direction = app.scrollMode ? 'top' : 'left';
    if (el) {
      const position = _Util.getMatchedCSSValue(el, 'position', true);
      if (direction === 'left' && position === 'absolute') {
        direction = 'top';
      }
    }
    return direction;
  }

  static _getOffsetFromAnchor(anchor, block) {
    const el = document.getElementById(anchor);
    if (el) {
      const iterator = _Util.createTextNodeIterator(el);
      const node = iterator.nextNode();
      if (node) {
        // 첫번째 텍스트만 확인
        const range = document.createRange();
        range.selectNodeContents(node);

        const rects = range.getAdjustedClientRects();
        if (rects.length) {
          return block(rects[0], el);
        }
      }

      // 텍스트 노드 없는 태그 자체에 anchor가 걸려있으면
      return block(el.getAdjustedBoundingClientRect(), el);
    }
    return block({ left: null, top: null }, null);
  }

  static getPageOffsetFromAnchor(anchor) {
    return this._getOffsetFromAnchor(anchor, (rect, el) => this.getPageOffsetFromRect(rect, el));
  }

  static getScrollYOffsetFromAnchor(anchor) {
    return this._getOffsetFromAnchor(anchor, (rect) => rect.top);
  }

  static _getOffsetFromSerializedRange(serializedRange, block) {
    try {
      const range = _Util.getRangeFromSerializedRange(serializedRange);
      const rects = range.getAdjustedClientRects();
      return block(rects.length ? rects[0] : null);
    } catch (e) {
      return block(null);
    }
  }

  static getPageOffsetFromSerializedRange(serializedRange) {
    return this._getOffsetFromSerializedRange(serializedRange,
      (rect) => this.getPageOffsetFromRect(rect));
  }

  static getScrollYOffsetFromSerializedRange(serializedRange) {
    return this._getOffsetFromSerializedRange(serializedRange,
      (rect) => (rect || { top: null }).top);
  }

  static getFootnoteRegex() {
    return /^(\[|\{|\(|주|)[0-9].*(\)|\}|\]|\.|)$/gm;
  }

  static getSplitWordRegex() {
    return new RegExp(' |\\u00A0');
  }

  static getTextAndImageNodes() {
    return textAndImageNodes;
  }

  static setTextAndImageNodes() {
    // 주의! topNodeLocation의 nodeIndex에 영향을 주는 부분으로 함부로 수정하지 말것.
    const filter = (node) =>
      node.nodeType === Node.TEXT_NODE ||
      (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'IMG');

    let calledFilter = false;
    const walk = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node) {
          calledFilter = true;
          if (filter(node)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      },
      false
    );

    // 일부 Webkit에서 NodeFilter 기능이 동작하지 않는 경우가 있다.
    // 동작하지 않을 경우 element에 붙어있는 모든 노드가 끌려옴으로 수동으로 필터링해야 한다.
    const nodes = [];
    let node;
    while ((node = walk.nextNode())) {
      if (calledFilter) {
        nodes.push(node);
      } else if (filter(node)) {
        nodes.push(node);
      }
    }

    textAndImageNodes = nodes;
  }

  static _findTopNodeRectOfCurrentPage(rects, startOffset, endOffset) {
    const origin = app.scrollMode ? 'top' : 'left';
    for (let j = 0; j < rects.length; j++) {
      // rect 값이 현재 보고있는 페이지의 최상단에 위치하고 있는지
      const rect = rects[j];
      if (startOffset <= rect[origin] && rect[origin] <= endOffset && rect.width > 0) {
        return {
          rect: new MutableClientRect(rect),
          index: j
        };
      }
    }
    return null;
  }

  static findTopNodeRectAndLocationOfCurrentPage(startOffset, endOffset, posSeparator) {
    const nodes = this.getTextAndImageNodes();
    if (!nodes) {
      this.setTextAndImageNodes();
      return null;
    }

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const range = document.createRange();
      range.selectNodeContents(node);

      const rect = range.getAdjustedBoundingClientRect();
      if (!rect) {
        return null;
      }

      // 노드가 현재 보고있는 페이지의 최상단에 위치하거나 걸쳐있는지.
      const origin = app.scrollMode ? (rect.top + rect.height) : (rect.left + rect.width);
      if (rect.width === 0 || origin < startOffset) {
        continue;
      }

      let topNode;
      if (node.nodeType === Node.TEXT_NODE) {
        const string = node.nodeValue;
        if (!string) {
          continue;
        }

        const words = string.split(this.getSplitWordRegex());
        let offset = range.startOffset;
        for (let j = 0; j < words.length; j++) {
          const word = words[j];
          if (word.trim().length) {
            try {
              range.setStart(node, offset);
              range.setEnd(node, offset + word.length);
            } catch (e) {
              return null;
            }
            const rects = range.getAdjustedClientRects();
            if ((topNode = this._findTopNodeRectOfCurrentPage(rects, startOffset, endOffset))) {
              const location = (i + posSeparator + Math.min(j + topNode.index, words.length - 1));
              return { rect: topNode.rect, location };
            }
          }
          offset += (word.length + 1);
        }
      } else if (node.nodeName === 'IMG') {
        const rects = range.getAdjustedClientRects();
        if ((topNode = this._findTopNodeRectOfCurrentPage(rects, startOffset, endOffset))) {
          // 이미지 노드는 워드 인덱스를 구할 수 없기 때문에 0을 사용하며, 위치를 찾을때 이미지 노드의 rect가 현재 위치다.
          const location = `${i}${posSeparator}0`;
          return { rect: topNode.rect, location };
        }
      }
    }

    return null;
  }

  static setDebugTopNodeLocation(enabled) {
    debugTopNodeLocation = enabled;
  }

  static showTopNodeLocation(topNode) {
    if (!debugTopNodeLocation) {
      return;
    }

    let span = document.getElementById('RidiTopNode');
    if (!span) {
      span = document.createElement('span');
      span.setAttribute('id', 'RidiTopNode');
      document.body.appendChild(span);
    }

    const rect = topNode.rect;
    if (app.scrollMode) {
      rect.top += window.pageYOffset;
    } else {
      rect.left += window.pageXOffset;
    }

    span.style.cssText =
      'position: absolute !important;' +
      'background-color: red !important;' +
      `left: ${rect.left}px !important;` +
      `top: ${rect.top}px !important;` +
      `width: ${(rect.width || 3)}px !important;` +
      `height: ${rect.height}px !important;` +
      'display: block !important;' +
      'opacity: 0.4 !important;' +
      'z-index: 99 !important;';
  }

  static _getPageOffsetAndRectFromTopNodeLocation(nodeIndex, wordIndex) {
    const pageUnit = app.pageUnit;
    const totalPageSize = this.getTotalPageSize();
    const notFound = { pageOffset: null };

    const nodes = textAndImageNodes;
    if (pageUnit === 0 || nodeIndex === -1 || wordIndex === -1 ||
      nodes === null || nodes.length <= nodeIndex) {
      return notFound;
    }

    const node = nodes[nodeIndex];
    if (!node) {
      return notFound;
    }

    const range = document.createRange();
    range.selectNodeContents(node);

    let rect = range.getAdjustedBoundingClientRect();
    if (rect.left === 0 && rect.top === 0 && rect.right === 0 && rect.bottom === 0) {
      return notFound;
    }

    let pageOffset = this.getPageOffsetFromRect(rect);
    if (pageOffset === null || totalPageSize <= pageUnit * pageOffset) {
      return notFound;
    }

    if (node.nodeName === 'IMG' && wordIndex === 0) {
      return { pageOffset, rect };
    }

    const string = node.nodeValue;
    if (string === null) {
      return notFound;
    }

    const words = string.split(this.getSplitWordRegex());
    let word;
    let offset = 0;
    for (let i = 0; i <= Math.min(wordIndex, words.length - 1); i++) {
      word = words[i];
      offset += (word.length + 1);
    }
    try {
      range.setStart(range.startContainer, offset - word.length - 1);
      range.setEnd(range.startContainer, offset - 1);
    } catch (e) {
      return notFound;
    }

    rect = range.getAdjustedBoundingClientRect();
    pageOffset = this.getPageOffsetFromRect(rect);
    if (pageOffset === null || totalPageSize <= pageUnit * pageOffset) {
      return notFound;
    }

    if (rect.left < 0) {
      if (rect.width < pageUnit) {
        pageOffset++;
      } else {
        pageOffset += Math.floor(rect.width / pageUnit);
      }
    }

    return { pageOffset, rect };
  }

  static getPageOffsetFromTopNodeLocation(nodeIndex, wordIndex) {
    return this._getPageOffsetAndRectFromTopNodeLocation(nodeIndex, wordIndex).pageOffset;
  }

  static getScrollYOffsetFromTopNodeLocation(nodeIndex, wordIndex) {
    const rect = this._getPageOffsetAndRectFromTopNodeLocation(nodeIndex, wordIndex).rect;
    return (rect || { top: null }).top;
  }

  static _getImageSize(imgEl) {
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
      aHeight: (attrs.height || zeroAttr).value
    };
  }

  static reviseImage(imgEl, canvasWidth, canvasHeight, paddingTop) {
    const isPercentValue = (value) => {
      if (typeof value === 'string') {
        return value.search(/%/);
      }
      return -1;
    };

    const compareSize = (size1, size2) => {
      const intVal = parseInt(size1, 10);
      if (!isNaN(intVal)) {
        if (isPercentValue(size1) !== -1) {
          if (intVal > 100) {
            return 1;
          } else if (intVal < 100) {
            return -1;
          }
        } else {
          if (size2 < intVal) {
            return 1;
          } else if (size2 > intVal) {
            return -1;
          }
        }
      }
      return 0;
    };

    const calcRate = (width = 1, height = 1) => {
      let n;
      let m;
      if (width > height) {
        n = height;
        m = width;
      } else {
        n = width;
        m = height;
      }
      return (n / m) * 100;
    };

    const size = this._getImageSize(imgEl);

    let cssWidth = '';
    let cssHeight = '';
    let cssMaxWidth = '';
    let cssMaxHeight = '';

    // 원본 사이즈가 없다는 것은 엑박이란 거다
    if (size.nWidth === 0 || size.nHeight === 0) {
      return null;
    }

    //
    // * 너비와 높이 크기 보정(CSS 속성과 엘리먼트 속성 그리고 원본 사이즈를 이용한)
    //   - CSS 속성 또는 엘리먼트 속성이 반영된 사이즈가 원본 사이즈보다 클 때 'initial'로 보정한다.
    //     --> width 또는 height의 값이 100% 이상일 때.
    //        (CP에서 원본 비율과 깨짐을 떠나서 단순히 여백 없이 출력하기 위해 100% 이상을 사용하더라)
    //     --> 최종 계산된 width 또는 height의 값(px)이 원본 사이즈보다 클 때.
    //   - CP에서 의도적으로 원본보다 크게 설정한 경우 난감하다.
    //

    if (compareSize(size.sWidth, size.nWidth) > 0 ||
      compareSize(size.aWidth, size.nWidth) > 0) {
      cssWidth = 'initial';
    }

    if (compareSize(size.sHeight, size.nHeight) > 0 ||
      compareSize(size.aHeight, size.nHeight) > 0) {
      cssHeight = 'initial';
    }

    //
    // * 너비와 높이 비율 보정(원본 사이즈, 랜더링된 이미지 사이즈를 이용한)
    //   - 원본 비율이 랜더링된 이미지 비율과 다를때 상황에 맞춰 보정을 한다.
    //     --> 비율은 다르나 랜더링된 이미지의 너비 또는 높이가 원본보다 작을때 근사값으로 비율을 조정해준다.
    //        다만, 근사값으로 조정한 사이즈가 화면 사이즈를 벗어나는 상황이라면 'initial'로 보정한다.
    //     --> 비율도 다르고 랜더링된 이미지의 너비 또는 높이가 원본보다 클 때 'initial'로 보정한다.
    //   - CP에서 의도적으로 비율을 깨버렸다면 매우 곤란하다.
    //

    const diff = 1;
    let rate = 0;
    if ((size.nWidth >= size.nHeight) !== (size.dWidth >= size.dHeight) ||
      Math.abs(calcRate(size.nWidth, size.nHeight) - calcRate(size.dWidth, size.dHeight)) > diff) {
      if (size.dWidth >= size.dHeight && size.dWidth < size.nWidth) {
        rate = (calcRate(size.dWidth, size.nWidth) / 100);
        if (size.dWidth < canvasWidth && Math.round(size.nHeight * rate) < canvasHeight) {
          cssWidth = `${size.dWidth}px`;
          cssHeight = `${Math.round(size.nHeight * rate)}px`;
        } else {
          cssWidth = 'initial';
          cssHeight = 'initial';
        }
      } else if (size.dWidth < size.dHeight && size.dHeight < size.nHeight) {
        rate = (calcRate(size.dHeight, size.nHeight) / 100);
        if (Math.round(size.nWidth * rate) < canvasWidth && size.dHeight < canvasHeight) {
          cssWidth = `${Math.round(size.nWidth * rate)}px`;
          cssHeight = `${size.dHeight}px`;
        } else {
          cssWidth = 'initial';
          cssHeight = 'initial';
        }
      } else {
        cssWidth = 'initial';
        cssHeight = 'initial';
      }
    }

    //
    // * 이미지 잘림 보정(1)
    //   - 앞선 과정에서 보정된 또는 보정되지 않은 사이즈가 페이지를 벗어날 때 페이지에 맞게 보정해 준다.
    //    (높이만 보정을 하는 이유는 DOM 너비는 화면 너비에 맞게 되어있고 DOM 높이는 스크롤의 전체 길이이기 때문이다.)
    //     --> 랜더링된 이미지의 높이가 페이지 보다 크거나 같을 때 페이지에 맞게 보정한다.
    //        (단순히 페이지보다 작게 만드는게 아니라 이미지의 상단 여백을 가져와 페이지 높이에 뺀 값으로 보정한다.)
    //        (이미지의 상단 여백은 '-webkit-text-size-adjust'에 영향 받고 있으니 참고하자.)
    //     --> 랜더링된 이미지의 높이가 페이지 보다 작지만 부모의 padding-top에 의해 페이지를 벗어나는 경우 페이지에 맞게 보정한다.
    //        (bookId=321000105의 커버 페이지가 그러함)
    //

    let _paddingTop = paddingTop;
    if (!app.scrollMode) {
      const mHeight = parseInt(cssHeight, 10) || size.dHeight;
      let offsetTop = imgEl.offsetTop || 0;
      if (mHeight >= canvasHeight
        || (offsetTop < canvasHeight && mHeight + offsetTop >= canvasHeight)) {
        offsetTop = (offsetTop + paddingTop) % canvasHeight;
        if (offsetTop > 0) {
          cssHeight = `${canvasHeight - offsetTop}px`;
        }
        _paddingTop += offsetTop;
        if (cssWidth.length) {
          cssWidth = 'initial';
        }
      }
    }

    //
    // * 이미지 잘림 보정(2)
    //   - 제작 과정에서 이 속성을 사용할 수 있기 때문에 '!important'를 붙이지는 못하고
    //    수치가 100%를 넘을때나 속성이 없을때 추가해준다.
    //    (100%를 초과하면 사이즈에 따라 이미지가 잘리는것을 볼 수 있다)
    //    (높이를 95%로 주는 이유는 spine에 이미지 하나만 있을 때 p테그의 줄간, 서체 크기에
    //     영향을 받아 빈 페이지가 들어가기 때문이다.)
    //

    const maxWidth = _Util.getMatchedCSSValue(imgEl, 'max-width');
    if (isPercentValue(maxWidth) && parseInt(maxWidth, 10) > 100) {
      cssMaxWidth = '100%';
    }

    const maxHeight = _Util.getMatchedCSSValue(imgEl, 'max-height');
    if (isPercentValue(maxHeight) && parseInt(maxHeight, 10) > 95) {
      cssMaxHeight = '95%';
    }


    return {
      el: imgEl,
      width: cssWidth,
      height: cssHeight,
      maxWidth: cssMaxWidth,
      maxHeight: cssMaxHeight,
      position: '',
      paddingTop: _paddingTop,
      size
    };
  }
}
