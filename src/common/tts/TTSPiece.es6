import TTSUtil from './TTSUtil';
import _EPub from '../_EPub';
import _Util from '../_Util';

export default class TTSPiece {
  get nodeIndex() { return this._nodeIndex; }
  get startWordIndex() { return this._startWordIndex; }
  get endWordIndex() { return this._endWordIndex; }
  get node() { return this._node; }
  get text() { return this._text; }
  get length() { return this._length; }
  // node.nodeValue (piece.text 아님) 의 좌측 끝에서 startWordIndex에 해당하는 단어의
  // 첫 글자 까지의 offset
  get paddingLeft() { return this._paddingLeft; }
  // node.nodeValue (piece.text 아님) 의 우측 끝에서 endWordIndex에 해당하는 단어의
  // 마지막 글자 까지의 offset
  get paddingRight() { return this._paddingRight; }

  constructor(nodeIndex, startWordIndex = -1, endWordIndex = -1) {
    if (typeof nodeIndex !== 'number' || typeof startWordIndex !== 'number'
      || typeof endWordIndex !== 'number') {
      throw new Error('TTSPiece: nodeIndex or startWordIndex or endWordIndex is invalid.');
    }

    const nodes = _EPub.getTextAndImageNodes();
    if (nodes === null) {
      throw new Error('TTSPiece: nodes is empty. make call epub.setTextAndImageNodes().');
    } else if (nodes.length - 1 < nodeIndex) {
      throw new Error(`TTSPiece: nodeIndex is out of bounds(${nodeIndex}/${nodes.length - 1}).`);
    } else if (nodes[nodeIndex] === null) {
      throw new Error('TTSPiece: node not found on nodes.');
    } else {
      this._node = nodes[nodeIndex];
      this._nodeIndex = nodeIndex;
    }

    const nodeValue = this._node.nodeValue;
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

  isInvalid() {
    const node = this._node;
    let el = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node);
    const readable = (el.attributes['data-ridi-tts'] || { value: '' }).value.toLowerCase();
    let valid = true;

    if (this.length === 0 || readable === 'no') {
      valid = false;
    } else if (readable !== 'yes') {
      if (_Util.getMatchedCSSValue(el, 'display') === 'none') {
        // 눈에 보이지 않는 것은 읽지 않는다
        valid = false;
      } else {
        do {
          // 주석 링크는 읽지 않는다
          if (el.nodeName === 'A' && this._text.match(_EPub.getFootnoteRegex()) !== null) {
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

  // TopNodeLocation을 작업할 때 br 태그로 newLine이 가능하다는 것을 잊고 있었음;
  // TopNodeLocation이 정식 버전에 들어간 상태라 br 태그를 textAndImageNodes에 포함시킬 수도 없고.. 이런식으로... 허허;
  // <span><strong>TEXT</strong></span><br> 이런 경우에 대비하여 parentNode의 sibling까지 탐색하고 있다.
  isSiblingBrRecursive(checkNextSibling = true) {
    let node = this._node;
    while (node) {
      let sibling = node[checkNextSibling ? 'nextSibling' : 'previousSibling'];
      // 위의 예시에서 <p><br></p> 이렇게 br이 다른 element 안에 있을 수도 있다.
      while (sibling) {
        if (sibling.nodeName === 'BR') {
          return true;
        }

        const childNodes = sibling.childNodes;
        if (childNodes.length > 0) {
          sibling = childNodes[checkNextSibling ? 0 : (childNodes.length - 1)];
        } else {
          return false;
        }
      }

      node = node.parentNode;
    }

    return false;
  }

  isOnlyWhitespace() {
    const pNode = this._node.previousSibling;
    const regex = TTSUtil.getWhitespaceAndNewLineRegex(null, `{${this.length},}`);
    let only = this.text.match(regex) !== null;
    if (only && pNode !== null) {
      only = pNode.nodeName !== 'SPAN';
    }
    return only;
  }

  isSentence() {
    return this.text.trim().match(TTSUtil.getSentenceRegex(null, '$')) !== null;
  }
}
