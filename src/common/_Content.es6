import _Object from './_Object';
import _Util from './_Util';

export default class _Content extends _Object {
  /**
   * @returns {Reader} reader
   */
  get reader() { return this._reader; }

  /**
   * @returns {HTMLElement}
   */
  get wrapper() { return this._wrapper; }

  /**
   * @returns {HTMLElement}
   */
  get body() { return this.wrapper.getElementsByTagName('BODY')[0] || this.wrapper; }

  /**
   * @returns {Node[]}
   */
  get nodes() { return this._nodes; }

  /**
   * @returns {HTMLElement[]}
   */
  get images() { return this.wrapper.getElementsByTagName('IMG'); }

  get customElementFromPointEnabled() { return false; }

  /**
   * @param {Reader} reader
   * @param {HTMLElement} wrapper
   */
  constructor(reader, wrapper) {
    super();
    this._reader = reader;
    this._wrapper = wrapper;
    this.updateNodes();
  }

  updateNodes() {
    this._nodes = this.fetchNodes();
  }

  /**
   * @returns {Node[]}
   */
  fetchNodes() {
    // 주의! NodeLocation의 nodeIndex에 영향을 주는 부분으로 함부로 수정하지 말것.
    const filter = node =>
      node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'IMG');
    const iterator = document.createNodeIterator(this.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        return filter(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    }, false);

    const nodes = [];
    let node;
    while ((node = iterator.nextNode())) {
      nodes.push(node);
    }
    return nodes;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {?String} tag
   * @returns {HTMLElement|null}
   */
  elementFromPoint(x, y, tag) {
    const point = this.reader.normalizePoint(x, y);
    if (this.customElementFromPointEnabled) {
      // z-index 같이 계층에 영향 주는 요소를 고려하지 않았기 때문에 레이아웃이 복잡할 경우 오작동할 수 있음.
      // (참고: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index)
      const find = (el) => {
        const rects = el.getClientRects().bind(this.reader).normalizeRect();
        return rects.find(rect => rect.contains(x, y)) !== undefined;
      };
      if (tag) {
        const els = this.body.querySelectorAll(tag);
        return els.find(find) || null;
      }
      const iterator = document.createNodeIterator(this.body, NodeFilter.SHOW_ELEMENT, {
        acceptNode() {
          return NodeFilter.FILTER_ACCEPT;
        },
      }, false);
      let el;
      while ((el = iterator.nextNode())) {
        if (find(el)) {
          return el;
        }
      }
      return null;
    }
    const result = document.elementFromPoint(point.x, point.y);
    if (result && tag) {
      return result.nodeName === tag ? result : null;
    }
    return result;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {String|null}
   */
  imagePathFromPoint(x, y) {
    const el = this.elementFromPoint(x, y, 'IMG');
    return el ? el.src : null;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {String|null}
   */
  svgHtmlFromPoint(x, y) {
    const el = this.elementFromPoint(x, y, 'SVG');
    if (el) {
      let prefix = '<svg';
      const attrs = el.attributes;
      for (let i = 0; i < attrs.length; i += 1) {
        const attr = attrs[i];
        prefix += ` ${attr.nodeName}="${attr.nodeValue}"`;
      }
      prefix += '>';
      // svg 객체는 innerHTML 을 사용할 수 없으므로 아래와 같이 바꿔준다.
      const svgEl = document.createElement('svgElement');
      const nodes = el.childNodes;
      for (let j = 0; j < nodes.length; j += 1) {
        svgEl.appendChild(nodes[j].cloneNode(true));
      }
      return `${prefix}${svgEl.innerHTML}</svg>`;
    }
    return null;
  }


  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {{node: Node, href: String, type: String}|null}
   */
  linkFromPoint(x, y) {
    if (document.links.length === 0) {
      return null;
    }

    const point = this.reader.normalizePoint(x, y);
    const tolerance = 12;
    const stride = 6;
    for (let x = point.x - tolerance; x <= point.x + tolerance; x += stride) { // eslint-disable-line no-shadow
      for (let y = point.y - tolerance; y <= point.y + tolerance; y += stride) { // eslint-disable-line no-shadow
        const el = this.elementFromPoint(x, y, 'A');
        if (el) {
          const link = this._getLinkFromElement(el);
          if (link !== null) {
            return link;
          }
        }
      }
    }

    return null;
  }

  /**
   * @param {Node} el
   * @returns {{node: Node, href: string, type: string}}
   */
  _getLinkFromElement(el) {
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

  /**
   * @param {Node} imgEl
   * @param {Number} screenWidth
   * @param {Number} screenHeight
   * @returns {{el: Node, width: String, height: String, position: String,
   * size: {dWidth, dHeight, nWidth, nHeight, sWidth, sHeight, aWidth, aHeight}}}
   */
  reviseImage(imgEl, screenWidth, screenHeight) {
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
        } if (size2 < intVal) {
          return 1;
        } else if (size2 > intVal) {
          return -1;
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

    const maxHeight = 0.95;
    const size = _Util.getImageSize(imgEl);
    let cssWidth = '';
    let cssHeight = '';

    // 원본 사이즈가 없다는 것은 엑박이란 거다
    if (size.nWidth === 0 || size.nHeight === 0) {
      return {
        el: imgEl,
        width: cssWidth,
        height: cssHeight,
        position: '',
        size,
      };
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
        if (size.dWidth < screenWidth && Math.round(size.nHeight * rate) < screenHeight) {
          cssWidth = `${size.dWidth}px`;
          cssHeight = `${Math.round(size.nHeight * rate)}px`;
        } else {
          cssWidth = 'initial';
          cssHeight = 'initial';
        }
      } else if (size.dWidth < size.dHeight && size.dHeight < size.nHeight) {
        rate = (calcRate(size.dHeight, size.nHeight) / 100);
        if (Math.round(size.nWidth * rate) < screenWidth && size.dHeight < screenHeight) {
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
    // * 이미지 잘림 보정
    //   - 보정된 이미지의 크기나 랜더링된 크기가 화면을 벗어날 경우 잘려보이기나 찌그러져 보이기 때문에 화면보다 작게 보정한다.
    //   - 이미지에 붙은 여백, 줄간 때문에 다음 페이지에 빈 페이지가 생길 수 있기 때문에 모든 여백을 뺀다.
    //     --> TODO: 이미지의 부모들이 가진 여백 때문에 이전/다음 페이지에 빈 페이지가 생기는 문제에 대한 대응 필요 -> 계약직 아내
    //   - 보정할 높이가 화면의 가장 작은 부분(vmin)보다 작아지지 않도록 한다. (이미지가 작아서 보기 힘들어지기 때문)
    //

    const width = parseInt(cssWidth, 10) || size.dWidth;
    const height = parseInt(cssHeight, 10) || size.dHeight;
    if (width > screenWidth || height > screenHeight) {
      const margin = _Util.getStylePropertiesIntValue(imgEl,
        ['line-height', 'margin-top', 'margin-bottom', 'padding-top', 'padding-bottom']);
      const vmin = Math.min(screenWidth, screenHeight);
      let adjustHeight = Math.max((screenHeight - margin) * maxHeight, vmin * maxHeight);
      let adjustWidth = (adjustHeight / size.nHeight) * size.nWidth;
      if (adjustWidth > screenWidth) {
        adjustHeight *= screenWidth / adjustWidth;
        adjustWidth = screenWidth;
      }
      cssWidth = `${adjustWidth}px`;
      cssHeight = `${adjustHeight}px`;
    }


    return {
      el: imgEl,
      width: cssWidth,
      height: cssHeight,
      position: '',
      size,
    };
  }
}
