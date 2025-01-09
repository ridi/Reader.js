import SpeechUtil from './SpeechUtil';
import Util from './Util';

/**
 * @class SpeechPiece
 * @private @property {number} _nodeIndex
 * @private @property {number} _startWordIndex
 * @private @property {number} _endWordIndex
 * @private @property {Node} _node
 * @private @property {string} _text
 * @private @property {number} _paddingLeft
 * @private @property {number} _paddingRight
 */
export default class SpeechPiece {
  /**
   * @returns {mumber}
   */
  get nodeIndex() { return this._nodeIndex; }

  /**
   * @returns {mumber}
   */
  get startWordIndex() { return this._startWordIndex; }

  /**
   * @returns {mumber}
   */
  get endWordIndex() { return this._endWordIndex; }

  /**
   * @returns {Node}
   */
  get node() { return this._node; }

  /**
   * @returns {string}
   */
  get text() { return this._text; }

  /**
   * @returns {number}
   */
  get length() { return this.text.length; }

  /**
   * node.nodeValue (piece.text 아님) 의 좌측 끝에서 startWordIndex에 해당하는 단어의 첫 글자까지의 offset
   *
   * @returns {number}
   */
  get paddingLeft() { return this._paddingLeft; }

  /**
   * node.nodeValue (piece.text 아님) 의 우측 끝에서 endWordIndex에 해당하는 단어의 마지막 글자까지의 offset
   *
   * @returns {number}
   */
  get paddingRight() { return this._paddingRight; }

  /**
   * @param {Node} node
   * @param {mumber} nodeIndex
   * @param {mumber} startWordIndex
   * @param {mumber} endWordIndex
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
        const words = nodeValue.split(SpeechUtil.getSplitWordRegex());

        if (startWordIndex >= words.length || endWordIndex >= words.length) {
          throw new Error('SpeechPiece: wordIndex is out of bounds - '
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
    } else if (this._node.nodeName.toLowerCase() === 'img') {
      this._text = this._node.alt || '';
    }
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
      if (Util.getMatchedCSSValue(el, 'display') === 'none'
        || Util.getMatchedCSSValue(el, 'visibility') === 'hidden') {
        // 눈에 보이지 않는 것은 읽지 않는다
        valid = false;
      } else {
        do {
          // 주석 링크는 읽지 않는다
          if (el.nodeName.toLowerCase() === 'a' && this._text.match(Util.getFootnoteRegex()) !== null) {
            valid = false;
            break;
          }
          if (el.nodeName.toLowerCase() === 'script') {
            valid = false;
            break;
          }
          if (el.nodeName.toLocaleLowerCase() === 'script') {
            valid = false;
            break;
          }
          // 공백만 있는 span 태그 읽지 않도록
          if (el.nodeName.toLowerCase() === 'span') {
            // 텍스트가 공백인 경우
            const isEmptyText = this._text.trim() === '';
            // 자식 노드가 없는 경우
            const hasNoChildren = !el.hasChildNodes();
            // 부모가 span이고 형제 노드가 있는 경우 유효하다고 판단
            const hasValidParentAndSiblings =
              el.parentNode &&
              el.parentNode.nodeName.toLowerCase() === 'span' &&
              (el.previousSibling || el.nextSibling);
            // 부모의 자식 노드들 중 유효한 텍스트가 있는지 확인
            const hasValidSiblingContent = el.parentNode && Array.from(el.parentNode.childNodes).some(childNode => (
              (childNode.nodeType === Node.TEXT_NODE && childNode.nodeValue.trim() !== '') ||
              (childNode.nodeType === Node.ELEMENT_NODE && childNode.textContent.trim() !== '')
            ));

            if (isEmptyText && (hasNoChildren || (!hasValidParentAndSiblings && !hasValidSiblingContent))) {
              valid = false;
              break;
            }
          }
          // 이미지, 독음(후리가나)과 첨자는 읽지 않는다
          if (!(valid = (['rt', 'rp', 'sub', 'sup', 'img'].indexOf(el.nodeName.toLowerCase()) === -1))) {
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
   * @param {boolean} checkNextSibling
   * @returns {boolean}
   */
  isSiblingBrRecursive(checkNextSibling = true) {
    let node = this._node;
    while (node) {
      let sibling = node[checkNextSibling ? 'nextSibling' : 'previousSibling'];
      // 위의 예시에서 <p><br></p> 이렇게 br이 다른 element 안에 있을 수도 있다.
      while (sibling) {
        if (sibling.nodeName.toLowerCase() === 'br') {
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
   * @returns {boolean}
   */
  isOnlyWhitespace() {
    const pNode = this._node.previousSibling;
    const regex = SpeechUtil.getWhitespaceAndNewLineRegex(null, `{${this.length},}`);
    let only = this.text.match(regex) !== null;
    if (only) {
      only = this._node.parentElement.nodeName.toLowerCase() !== 'span';
      if (pNode !== null) {
        only = pNode.nodeName.toLowerCase() !== 'span';
      }
    }
    return only;
  }

  /**
   * @returns {boolean}
   */
  isSentence() {
    return this.text.trim().match(SpeechUtil.getSentenceRegex(null, '$')) !== null;
  }
}
