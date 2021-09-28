import Logger from './Logger';
import NodeLocation from './NodeLocation';
import Rect from './Rect';
import Util from './Util';

const { TEXT_NODE, ELEMENT_NODE, DOCUMENT_POSITION_FOLLOWING, DOCUMENT_POSITION_CONTAINED_BY } = Node;
const { SHOW_TEXT, SHOW_ELEMENT } = NodeFilter;

const { Type } = NodeLocation;

const TOUCH_POINT_TOLERANCE = 12;
const TOUCH_POINT_STRIDE = 6;

/**
 * @class _Content
 * @private @property {HTMLElement} _ref
 * @private @property {Reader} _reader
 * @private @property {Context} _context
 * @private @property {?Sel} _sel
 * @private @property {?SpeechHelper} _speechHelper
 */
class _Content {
  /**
   * @returns {HTMLElement}
   */
  get ref() { return this._ref; }

  /**
   * @returns {?Sel}
   */
  get sel() { return this._sel; }

  /**
   * @returns {?SpeechHelper}
   */
  get speechHelper() { return this._speechHelper; }

  /**
   * @returns {Node[]} 콘텐츠(=스파인) 내 모든 텍스트와 이미지 노드를 반환한다.
   */
  get nodes() {
    this._nodes = this._nodes || this._getNodes();
    return this._nodes;
  }

  /**
   * @returns {HTMLElement[]} 콘텐츠(=스파인) 내 모든 이미지 엘리먼트를 반환한다.
   */
  get images() { return Array.from(this.ref.querySelectorAll('img')); }

  /**
   * @returns {boolean} 이미지 보정이 이뤄졌는지를 반환한다.
   */
  get isImagesRevised() { return this._isImagesRevised; }

  /**
   * @returns {Context}
   */
  get _context() { return this._reader.context; }

  /**
   * @param {HTMLElement} element
   * @param {Reader} reader
   */
  constructor(element, reader) {
    this._ref = element;
    this._reader = reader;
    this._sel = this._createSel();
    this._speechHelper = this._createSpeechHelper();
    this._nodes = null;
    this._isImagesRevised = false;
  }

  /**
   * @returns {Node[]}
   * @private
   */
  _getNodes() {
    // 주의! NodeLocation의 nodeIndex에 영향을 주는 부분으로 수정 시 마지막 페이지 동기화가 오작동할 수 있다.
    const filter =
      node => node.nodeType === TEXT_NODE || (node.nodeType === ELEMENT_NODE && node.nodeName.toLowerCase() === 'img');
    const iterator = Util.createNodeIterator(this.ref, SHOW_TEXT | SHOW_ELEMENT, filter);
    const nodes = [];
    let node;
    while ((node = iterator.nextNode())) {
      nodes.push(node);
    }
    return nodes;
  }

  /**
   * @returns {?Sel}
   * @private
   */
  _createSel() {
    return null;
  }

  /**
   * @returns {?SpeechHelper}
   * @private
   */
  _createSpeechHelper() {
    return null;
  }

  /**
   * @param {string} id
   * @param {number} x
   * @param {number} y
   * @returns {Rect}
   */
  getRectFromElementId(id, x, y) { // eslint-disable-line no-unused-vars
    try {
      const range = Range.fromSerializedRange(id, this.ref);
      const rects = range.startContainer.getClientRects().toRectList();
      let [rect] = rects;
      if (rects.length === 1) return rect;
      rect = rects.reduce((result, item) => {
        const mutable = result;
        const { left, right, top, height } = item;
        if (left <= x && x < right) {
          mutable.left += left;
          mutable.top += top;
        } else if (left >= 0 && x === undefined) {
          x = left; // eslint-disable-line no-param-reassign
          mutable.left += left;
          mutable.top += top;
        } else if (left < 0) {
          mutable.top -= height;
        }
        mutable.height += height;
        return mutable;
      }, new Rect({ width: rect.width }));

      rect.right = rect.left + rect.width;
      rect.bottom = rect.top + rect.height;

      return rect;
    } catch (e) {
      return null;
    }
  }

  /**
   * @param {HTMLElement} element
   * @returns {string}
   */
  _generateId(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.toSerializedRange(this.ref);
  }

  /**
   * @param {hoolean} hidden
   * @param {HTMLElement|string} elementOrId
   */
  setHidden(hidden, elementOrId) {
    let el;
    if (typeof elementOrId === 'string') {
      try {
        const range = Range.fromSerializedRange(elementOrId, this.ref);
        if (range) {
          el = range.startContainer;
        }
      } catch (e) {} // eslint-disable-line no-empty
      if (!el) {
        const [first] = document.getElementsByClassName(elementOrId);
        el = first || document.getElementById(elementOrId);
      }
    } else {
      el = elementOrId;
    }
    if (el) {
      el.style.visibility = hidden ? 'hidden' : '';
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {?string} tag
   * @returns {?HTMLElement}
   */
  elementFromPoint(x, y, tag) {
    if (this._context.isSameDomAsUi) {
      // z-index 같이 계층에 영향 주는 요소를 고려하지 않았기 때문에 레이아웃이 복잡할 경우 오작동할 수 있다.
      // (참고: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index)
      const find = element => element.getClientRects().toRectList().contains(x, y);
      if (tag) {
        return Array.from(this.ref.querySelectorAll(tag)).find(find) || null;
      }

      const iterator = Util.createNodeIterator(this.ref, SHOW_ELEMENT);
      let topElement = null;
      let element;
      while ((element = iterator.nextNode())) {
        if (find(element)) {
          if (topElement) {
            const result = topElement.compareDocumentPosition(element);
            if (result & DOCUMENT_POSITION_FOLLOWING || result & DOCUMENT_POSITION_CONTAINED_BY) {
              topElement = element;
            }
          } else {
            topElement = element;
          }
        }
      }

      return topElement;
    }

    let result = document.elementFromPoint(x, y);
    if (tag) {
      while (result && result.nodeName.toLowerCase() !== tag.toLowerCase()) {
        result = result.parentElement;
      }
    }
    return result;
  }

  /**
   * @typedef {object} Image
   * @property {string} id
   * @property {HTMLImageElement} element
   * @property {string} src
   * @property {Rect} rect
   */
  /**
   * @param {number} x
   * @param {number} y
   * @returns {?Image}
   */
  imageFromPoint(x, y) {
    const element = this.elementFromPoint(x, y, 'img');
    if (element && element.src) {
      const id = this._generateId(element);
      return {
        id,
        element,
        src: element.src || 'null',
        rect: this.getRectFromElementId(id, x, y),
      };
    }
    return null;
  }

  /**
   * @typedef {object} Svg
   * @property {string} id
   * @property {SVGElement} element
   * @property {string} html
   * @property {Rect} rect
   */
  /**
   * @param {number} x
   * @param {number} y
   * @returns {?Svg}
   */
  svgFromPoint(x, y) {
    const element = this.elementFromPoint(x, y, 'SVG');
    if (element) {
      let prefix = '<svg';
      const attrs = Array.from(element.attributes);
      attrs.forEach((attr) => {
        prefix += ` ${attr.nodeName}="${attr.nodeValue}"`;
      });
      prefix += '>';
      // svg 객체는 innerHTML 을 사용할 수 없으므로 아래와 같이 바꿔준다.
      const svgElement = document.createElement('svgElement');
      const nodes = element.childNodes;
      for (let j = 0; j < nodes.length; j += 1) {
        svgElement.appendChild(nodes[j].cloneNode(true));
      }

      const id = this._generateId(element);
      return {
        id,
        element: svgElement,
        html: `${prefix}${svgElement.innerHTML}</svg>`,
        rect: this.getRectFromElementId(id, x, y),
      };
    }
    return null;
  }

  /**
   * @typedef {object} Link
   * @property {Node} node
   * @property {string} href
   * @property {?string} type
   */
  /**
   * @param {Node} node
   * @returns {Link}
   * @private
   */
  _getLinkFromNode(node) {
    while (node) {
      const { nodeName, href, attributes } = node;
      if (node && nodeName.toLowerCase() === 'a') {
        return { node, href, type: (attributes['epub:type'] || { value: '' }).value };
      }
      node = node.parentNode;
    }
    return null;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {?Link}
   */
  linkFromPoint(x, y) {
    if (document.links.length === 0) {
      return null;
    }

    const point = { x, y };
    const tolerance = TOUCH_POINT_TOLERANCE;
    const stride = TOUCH_POINT_STRIDE;
    for (let x = point.x - tolerance; x <= point.x + tolerance; x += stride) { // eslint-disable-line no-shadow
      for (let y = point.y - tolerance; y <= point.y + tolerance; y += stride) { // eslint-disable-line no-shadow
        const element = this.elementFromPoint(x, y);
        if (element) {
          const link = this._getLinkFromNode(element);
          if (link !== null) {
            return link;
          }
        }
      }
    }

    return null;
  }

  /**
   * @typedef {object} ReviseImageMatrix
   * @property {HTMLImageElement} element
   * @property {string} width
   * @property {string} height
   * @property {string} position
   * @property {ImageSizeMatrix} matrix
   * @property {function} logger
   */
  /**
   * @param {HTMLImageElement} element
   * @param {number} screenWidth
   * @param {number} screenHeight
   * @returns {ReviseImageMatrix}
   */
  reviseImage(element, screenWidth, screenHeight) {
    const matrix = Util.getImageSizeMatrix(element);
    const {
      calcRatio,
      originSize,
      renderSize,
      style,
      attribute,
    } = matrix;

    const position = '';
    let cssWidth = '';
    let cssHeight = '';

    // Debug Info
    const logger = (caseNum) => {
      const src = element.src || '';
      Logger.debug(`Case: ${caseNum}, src: ${src}`);
      Logger.debug(`\tOrigin -> width: ${originSize.width}, height: ${originSize.height}`);
      Logger.debug(`\tRender -> width: ${renderSize.width}, height: ${renderSize.height}`);
      Logger.debug(`\tStyle -> width: ${style.width}, height: ${style.height}`);
      Logger.debug(`\tAttribute -> width: ${attribute.width}, height: ${attribute.height}`);
      Logger.debug(`\tAdjust -> width: ${cssWidth}, height: ${cssHeight}, position: ${position}`);
    };

    // Case 1. 원본 크기가 없는 경우 (=엑박)
    if (originSize.width === 0 || originSize.height === 0) {
      logger(1);
      return {
        element,
        width: cssWidth,
        height: cssHeight,
        position,
        matrix,
      };
    }

    // Case 2. CSS 또는 이미지 태그 속성이 원본 이미지 보다 크게 설정된 경우 (feat. CP)
    // - 대체값을 구하기 보다 웹 엔진이 맡기는 것이 빠르기 때문에 initial로 초기화
    if (matrix.isGreaterThanNaturalWidth) {
      cssWidth = 'initial';
    }
    if (matrix.isGreaterThanNaturalHeight) {
      cssHeight = 'initial';
    }
    if (cssWidth.length || cssHeight.length) {
      logger(2);
    }

    // Case 3. 랜더링된 이미지 비율과 원본 비율이 맞지 않는 경우 (feat. CP)
    // - 원본 보다 작으면 근사값으로 대체
    // - 대체한 값이 화면 크기보다 크거나 원본 보다 크면 initial로 대체
    const diff = 1;
    let rate = 0;
    if ((originSize.width >= originSize.height) !== (renderSize.width >= renderSize.height) ||
      Math.abs(originSize.ratio - renderSize.ratio) > diff) {
      if (renderSize.width >= renderSize.height && renderSize.width < originSize.width) {
        rate = (calcRatio(renderSize.width, originSize.width) / 100);
        if (renderSize.width < screenWidth && Math.round(originSize.height * rate) < screenHeight) {
          cssWidth = `${renderSize.width}px`;
          cssHeight = `${Math.round(originSize.height * rate)}px`;
        } else {
          cssWidth = 'initial';
          cssHeight = 'initial';
        }
      } else if (renderSize.width < renderSize.height && renderSize.height < originSize.height) {
        rate = (calcRatio(renderSize.height, originSize.height) / 100);
        if (Math.round(originSize.width * rate) < screenWidth && renderSize.height < screenHeight) {
          cssWidth = `${Math.round(originSize.width * rate)}px`;
          cssHeight = `${renderSize.height}px`;
        } else {
          cssWidth = 'initial';
          cssHeight = 'initial';
        }
      } else {
        cssWidth = 'initial';
        cssHeight = 'initial';
      }
      logger(3);
    }

    // Case 4. 보정된 크기나 랜더링된 크기가 화면을 벗어나는 경우
    // - 이미지에 붙은 여백, 줄간 때문에 벗어나는 경우일 수 있어 모두 제외
    // - 제외하다 보면 너무 작아질 수 있어 vmin으로 최소값을 보장
    const maxHeight = 0.97;
    const preferSize = {
      width: parseInt(cssWidth, 10) || renderSize.width,
      height: parseInt(cssHeight, 10) || renderSize.height,
    };
    if (preferSize.width > screenWidth || preferSize.height > screenHeight) {
      const bottom = Util.getStylePropertyValues(element, ['line-height', 'margin-bottom', 'padding-bottom']);
      const vmin = Math.min(screenWidth, screenHeight) / 2;
      let adjustHeight = Math.max((screenHeight - bottom) * maxHeight, vmin);
      let adjustWidth = (adjustHeight / originSize.height) * originSize.width;
      if (adjustWidth > screenWidth) {
        adjustHeight *= screenWidth / adjustWidth;
        adjustWidth = screenWidth;
      }
      cssWidth = `${adjustWidth}px`;
      cssHeight = `${adjustHeight}px`;
      logger(4);
    }

    return {
      element,
      width: cssWidth,
      height: cssHeight,
      position,
      matrix,
      logger,
    };
  }

  /**
   * @param {function} callback
   */
  reviseImages(callback) {
    if (this.isImagesRevised) {
      callback();
      return;
    }

    const { width: screenWidth, height: screenHeight } = this._context;
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

        setTimeout(() => {
          this._isImagesRevised = true;
          if (callback) {
            callback();
          }
        }, 0);
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
   * element의 위치 기준을 반환한다.
   *
   * @param {HTMLElement} element
   * @returns {string} top or left
   * @private
   */
  _getOffsetDirectionFromElement(element) {
    let direction = this._context.isScrollMode ? 'top' : 'left';
    if (element) {
      const position = Util.getMatchedCSSValue(element, 'position', true);
      if (direction === 'left' && position === 'absolute') {
        direction = 'top';
      }
    }
    return direction;
  }

  /**
   * @param {Rect} rect
   * @param {?HTMLElement} element
   * @returns {?number}
   */
  getPageFromRect(/* rect, element */) {
    return null;
  }

  /**
   * @param {string} id
   * @returns {?HTMLElement}
   */
  _getElementById(id) {
    if (this._reader.contents.length > 1 || id) {
      return this.ref.querySelector(`#${id}`);
    }
    return document.getElementById(id);
  }

  /**
   * @param {string} anchor
   * @param {function} block
   * @returns {number}
   * @private
   */
  _getOffsetFromAnchor(anchor, block) {
    const element = this._getElementById(anchor);
    if (element) {
      const iterator = Util.createTextNodeIterator(element);
      const node = iterator.nextNode();
      if (node) {
        // 첫번째 텍스트만 확인
        const range = document.createRange();
        range.selectNodeContents(node);

        const { display } = window.getComputedStyle(element);
        const rectList = range.getClientRects().toRectList().toAbsolute();
        if (rectList.length) {
          return block(rectList[0], element);
        } else if (display === 'none') {
          element.style.display = 'block';
          const rect = element.getBoundingClientRect().toRect().toAbsolute();
          element.style.display = 'none';
          return block(rect, element);
        }
      }

      // 텍스트 노드 없는 태그 자체에 anchor가 걸려있으면
      return block(element.getBoundingClientRect().toRect().toAbsolute(), element);
    }
    return block({ left: null, top: null }, null);
  }

  /**
   * anchor의 위치를 구한다.
   * 페이지 넘김 보기일 때는 zero-based page number를, 스크롤 보기일 때는 scrollYOffset을 반환한다.
   * 위치를 찾을 수 없을 경우 null을 반환한다.
   *
   * @param {string} anchor
   * @returns {?number}
   */
  getOffsetFromAnchor(anchor) {
    return this._getOffsetFromAnchor(anchor, (rect, element) => {
      if (this._context.isScrollMode) {
        return rect.top === null ? null : rect.top;
      }
      return rect.left === null ? null : this.getPageFromRect(rect, element);
    });
  }

  /**
   * serializedRange(rangy.js 참고)의 위치를 구한다.
   * 페이지 넘김 보기일 때는 zero-based page number를, 스크롤 보기일 때는 scrollYOffset을 반환한다.
   * 위치를 찾을 수 없을 경우 null을 반환한다.
   *
   * @param {string} serializedRange
   * @returns {?number}
   */
  getOffsetFromSerializedRange(serializedRange) {
    try {
      const range = Range.fromSerializedRange(serializedRange, this.ref);
      const rectList = range.getClientRects().toRectList().toAbsolute();
      if (rectList.length > 0) {
        if (this._context.isScrollMode) {
          return rectList[0].top;
        }
        return this.getPageFromRect(rectList[0]);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * @param {string} serializedRange
   * @returns {RectList}
   */
  getRectListFromSerializedRange(serializedRange) {
    return Range.fromSerializedRange(serializedRange, this.ref).getTextRectList().trim().toAbsolute();
  }

  /**
   * rectList 중에 startOffset~endOffset 사이에 위치한 rect의 index를 반환한다.
   * type이 bottom일 때 -1을 반환하는 경우가 있을 수 있는데 이전 rectList에 마지막 rect를 의미한다.
   *
   * @param {RectList} rectList
   * @param {number} startOffset
   * @param {number} endOffset
   * @param {string} type Type.TOP or Type.BOTTOM
   * @returns {?number}
   * @private
   */
  _findRectIndex(rectList, startOffset, endOffset, type = Type.TOP) {
    const origin = this._context.isScrollMode ? 'top' : 'left';
    for (let rectIndex = 0; rectIndex < rectList.length; rectIndex += 1) {
      const rect = rectList[rectIndex];
      if (type === Type.BOTTOM) {
        if (endOffset <= rect[origin] && rect.width > 0) {
          return rectIndex - 1;
        }
      } else if (startOffset <= rect[origin] && rect[origin] <= endOffset && rect.width > 0) {
        return rectIndex;
      }
    }
    return null;
  }

  /**
   * startOffset~endOffset 사이에 위치한 NodeLocation을 반환한다.
   * type으로 startOffset에 근접한 위치(top)를 찾을 것인지 endOffset에 근접한 위치(bottom)를 찾을 것인지 정할 수 있다.
   *
   * @param {number} startOffset
   * @param {number} endOffset
   * @param {string} type Type.TOP or Type.BOTTOM
   * @returns {?string}
   * @private
   */
  _findNodeLocation(startOffset, endOffset, type = Type.TOP) {
    const { nodes } = this;
    const { isScrollMode } = this._context;

    // 현재 페이지에 위치한 노드 정보를 임시로 저장한 것으로 BottomNodeLocation을 구할 때 사용한다.
    let prev = null;
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
      const node = nodes[nodeIndex];
      const range = document.createRange();
      range.selectNodeContents(node);

      let rect = range.getBoundingClientRect().toRect().toAbsolute();
      if (rect.isEmpty) {
        if (node.nodeName.toLowerCase() === 'img') {
          range.selectNode(node);
          rect = range.getBoundingClientRect().toRect().toAbsolute();
          if (rect.isEmpty) {
            continue;
          }
        } else {
          continue;
        }
      }

      // node가 여러 페이지에 걸쳐있을 때 현재 페이지도 포함하고 있는지.
      const origin = isScrollMode ? rect.maxY : rect.maxX;
      if (origin < startOffset) {
        continue;
      }

      let rectIndex;
      if (node.nodeType === TEXT_NODE) {
        const string = node.nodeValue;
        if (!string) {
          continue;
        }

        const words = string.split(Util.getSplitWordRegex());
        let offset = range.startOffset;
        for (let wordIndex = 0; wordIndex < words.length; wordIndex += 1) {
          const word = words[wordIndex];
          if (word.trim().length) {
            try {
              range.setStart(node, offset);
              range.setEnd(node, offset + word.length);
            } catch (e) {
              return null;
            }
            const rectList = range.getClientRects().toRectList().toAbsolute();
            if ((rectIndex = this._findRectIndex(rectList, startOffset, endOffset, type)) !== null) {
              if (rectIndex < 0) {
                this._reader.lastNodeLocationRect = prev.rect;
                return prev.location.toString();
              }
              this._reader.lastNodeLocationRect = rectList[rectIndex];
              return new NodeLocation(nodeIndex, Math.min(wordIndex + rectIndex, words.length - 1), type).toString();
            }
            rectList.reverse().forEach((rect) => { // eslint-disable-line
              if (rect[isScrollMode ? 'bottom' : 'top'] < endOffset) {
                prev = { location: new NodeLocation(nodeIndex, wordIndex, type), rect };
              }
            });
          }
          offset += (word.length + 1);
        }
      } else if (node.nodeName.toLowerCase() === 'img') {
        const rectList = range.getClientRects().toRectList().toAbsolute();
        if ((rectIndex = this._findRectIndex(rectList, startOffset, endOffset, type)) !== null) {
          if (rectIndex < 0) {
            this._reader.lastNodeLocationRect = prev.rect;
            return prev.location.toString();
          }
          this._reader.lastNodeLocationRect = rectList[rectIndex];
          // imageNode는 wordIndex를 구할 수 없기 때문에 0을 넣는다.
          return new NodeLocation(nodeIndex, 0, type).toString();
        }
        rectList.reverse().forEach((rect) => { // eslint-disable-line
          if (rect[isScrollMode ? 'bottom' : 'top'] < endOffset) {
            prev = { location: new NodeLocation(nodeIndex, 0, type), rect };
          }
        });
      }
    }

    return null;
  }

  /**
   * NodeLocation의 위치를 구한다.
   * 페이지 넘김 보기일 때는 zero-based page number를, 스크롤 보기일 때는 scrollYOffset을 반환한다.
   * 위치를 찾을 수 없을 경우 null을 반환한다.
   *
   * @param {string|NodeLocation} location
   * @param {string} type Type.TOP or Type.BOTTOM
   * @returns {?number}
   */
  getOffsetFromNodeLocation(location, type = Type.TOP) {
    if (location === null) {
      return null;
    }

    if (location instanceof NodeLocation) {
      location = location.toString();
    }
    const { nodeIndex, wordIndex } = NodeLocation.fromString(location, type);

    if (nodeIndex === -1 || wordIndex === -1) {
      return null;
    }

    const node = this.nodes[nodeIndex];
    if (!node) {
      return null;
    }

    const range = document.createRange();
    range.selectNodeContents(node);

    let rect = range.getBoundingClientRect().toRect().toAbsolute();
    if (rect.isEmpty) {
      if (node.nodeName.toLowerCase() === 'img') {
        range.selectNode(node);
        rect = range.getBoundingClientRect().toRect().toAbsolute();
        if (rect.isEmpty) {
          return null;
        }
      } else {
        return null;
      }
    }

    let page = this.getPageFromRect(rect);
    if (page === null || this._reader.totalSize <= this._context.pageUnit * page) {
      return null;
    }

    if (node.nodeName.toLowerCase() === 'img' && wordIndex === 0) {
      if (this._context.isScrollMode) {
        return Math.max(rect.top - (type === Type.BOTTOM ? this._context.pageUnit : 0), 0);
      }
      return page;
    }

    const string = node.nodeValue;
    if (string === null) {
      return null;
    }

    const words = string.split(Util.getSplitWordRegex());
    let word;
    let offset = 0;
    for (let i = 0; i <= Math.min(wordIndex, words.length - 1); i += 1) {
      word = words[i];
      offset += (word.length + 1);
    }
    try {
      range.setStart(range.startContainer, offset - word.length - 1);
      range.setEnd(range.startContainer, offset - 1);
    } catch (e) {
      return null;
    }

    const relativeRect = range.getBoundingClientRect().toRect();
    rect = relativeRect.toAbsolute();
    page = this.getPageFromRect(rect);
    if (page === null || this._reader.totalSize <= this._context.pageUnit * page) {
      return null;
    }

    if (this._context.isScrollMode) {
      return Math.max(rect.top - (type === Type.BOTTOM ? this._context.pageUnit : 0), 0);
    }

    if (relativeRect.left < 0 || (page + 1) * this._context.pageUnit < rect.maxX) {
      if (rect.width < this._context.pageUnit) {
        page += 1;
      } else {
        page += Math.floor(rect.width / this._context.pageUnit);
      }
    }
    return page;
  }
}

export default _Content;
