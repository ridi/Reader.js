import TTSUtil from './TTSUtil';
import _Util from '../_Util';

export default class TTSPiece {
  /**
   * @returns {Number}
   */
  get nodeIndex() { return this._nodeIndex; }

  /**
   * @returns {Number}
   */
  get startWordIndex() { return this._startWordIndex; }

  /**
   * @returns {Number}
   */
  get endWordIndex() { return this._endWordIndex; }

  /**
   * @returns {Node}
   */
  get node() { return this._node; }

  /**
   * @returns {String}
   */
  get text() { return this._text; }

  /**
   * @returns {Number}
   */
  get length() { return this._length; }

  /**
   * node.nodeValue (piece.text 아님) 의 좌측 끝에서 startWordIndex에 해당하는 단어의 첫 글자까지의 offset
   *
   * @returns {Number}
   */
  get paddingLeft() { return this._paddingLeft; }

  /**
   * node.nodeValue (piece.text 아님) 의 우측 끝에서 endWordIndex에 해당하는 단어의 마지막 글자까지의 offset
   *
   * @returns {Number}
   */
  get paddingRight() { return this._paddingRight; }

  /**
   * @param {Node} node
   * @param {Number} nodeIndex
   * @param {Number} startWordIndex
   * @param {Number} endWordIndex
   */
  constructor(node, nodeIndex, startWordIndex = -1, endWordIndex = -1) {
    this._node = node;
    this._nodeIndex = nodeIndex;

    const { nodeValue } = this._node;
    this._paddingLeft = 0;
    this._paddingRight = 0;
    this._text = '';
    this._startWordIndex = -1;
    this._endWordIndex = -1;

    if (typeof nodeValue === 'string') {
      if (startWordIndex < 0 && endWordIndex < 0) {
        this._text = nodeValue;
      } else {
        const words = nodeValue.split(TTSUtil.getSplitWordRegex());

        if (startWordIndex >= words.length || endWordIndex >= words.length) {
          throw new Error('TTSPiece: wordIndex is out of bounds - '
          + `startWordIndex: (${startWordIndex}/${words.length - 1}), `
          + `endWordIndex: (${endWordIndex}/${words.length - 1}).`);
        } else if (startWordIndex < 0) {
          this._startWordIndex = 0;
        } else {
          this._startWordIndex = startWordIndex;
        }
        // endWordIndex < 0인 경우는 default value를 사용한 것으로 간주한다.
        this._endWordIndex = (endWordIndex < 0 ? (words.length - 1) : endWordIndex);

        words.forEach((word, i, list) => {
          if (i >= this._startWordIndex && i <= this._endWordIndex) {
            this._text += `${word}${(i === list.length - 1 || i === this._endWordIndex) ? '' : ' '}`;
          } else if (i < this._startWordIndex) {
            // + 1 : for word delimiters
            this._paddingLeft += (word.length + 1);
          } else {
            this._paddingRight += (word.length + 1);
          }
        });
      }
    } else if (this._node.nodeName === 'IMG') {
      this._text = this._node.alt || '';
    }
    this._length = this._text.length;
  }

  /**
   * @returns {Boolean}
   */
  isInvalid() {
    const node = this._node;
    let el = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node);
    const readable = (el.attributes['data-ridi-tts'] || { value: '' }).value.toLowerCase();
    let valid = true;

    if (this.length === 0 || readable === 'no') {
      valid = false;
    } else if (readable !== 'yes') {
      if (_Util.getMatchedCSSValue(el, 'display') === 'none'
        || _Util.getMatchedCSSValue(el, 'visibility') === 'hidden') {
        // 눈에 보이지 않는 것은 읽지 않는다
        valid = false;
      } else {
        do {
          // 주석 링크는 읽지 않는다
          if (el.nodeName === 'A' && this._text.match(_Util.getFootnoteRegex()) !== null) {
            valid = false;
            break;
          }
          if (el.nodeName.toLowerCase() === 'script') {
            valid = false;
            break;
          }
          if (el && el.nodeType === Node.ELEMENT_NODE && el.textContent.trim().length === 0) {
            valid = false;
            break;
          }
          // 이미지, 독음(후리가나)과 첨자는 읽지 않는다
          if (!(valid = (['RT', 'RP', 'SUB', 'SUP', 'IMG'].indexOf(el.nodeName) === -1))) {
            break;
          }
        } while ((el = el.parentNode));
      }
    }
    return !valid;
  }

  /**
   * NodeLocation을 작업할 때 br 태그로 newLine이 가능하다는 것을 잊고 있었음;
   * NodeLocation이 정식 버전에 들어간 상태라 br 태그를 textAndImageNodes에 포함시킬 수도 없고.. 이런식으로... 허허;
   * <span><strong>TEXT</strong></span><br> 이런 경우에 대비하여 parentNode의 sibling까지 탐색하고 있다.
   *
   * @param {Boolean} checkNextSibling
   * @returns {Boolean}
   */
  isSiblingBrRecursive(checkNextSibling = true) {
    let node = this._node;
    while (node) {
      let sibling = node[checkNextSibling ? 'nextSibling' : 'previousSibling'];
      // 위의 예시에서 <p><br></p> 이렇게 br이 다른 element 안에 있을 수도 있다.
      while (sibling) {
        if (sibling.nodeName === 'BR') {
          return true;
        }

        const nodes = sibling.childNodes;
        if (nodes.length > 0) {
          sibling = nodes[checkNextSibling ? 0 : (nodes.length - 1)];
        } else {
          return false;
        }
      }

      node = node.parentNode;
    }

    return false;
  }

  /**
   * @returns {Boolean}
   */
  isOnlyWhitespace() {
    const pNode = this._node.previousSibling;
    const regex = TTSUtil.getWhitespaceAndNewLineRegex(null, `{${this.length},}`);
    let only = this.text.match(regex) !== null;
    if (only) {
      only = this._node.parentElement.nodeName !== 'SPAN';
      if (pNode !== null) {
        only = pNode.nodeName !== 'SPAN';
      }
    }
    return only;
  }

  /**
   * @returns {Boolean}
   */
  isSentence() {
    return this.text.trim().match(TTSUtil.getSentenceRegex(null, '$')) !== null;
  }
}
