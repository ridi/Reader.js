import TTSUtil from './TTSUtil';
import _EPub from '../_EPub';

export default class TTSPiece {
  get nodeIndex() { return this._nodeIndex; }
  get wordIndex() { return this._wordIndex; }
  get node() { return this._node; }
  get text() { return this._text; }
  get length() { return this._length; }
  get paddingLeft() { return this._paddingLeft; }

  constructor(nodeIndex, wordIndex) {
    if (typeof nodeIndex !== 'number' || typeof wordIndex !== 'number') {
      throw 'TTSPiece: nodeIndex or wordIndex is invalid.';
    }

    const nodes = _EPub.getTextAndImageNodes();
    if (nodes === null) {
      throw 'TTSPiece: nodes is empty. make call epub.setTextAndImageNodes().';
    } else if (nodes.length - 1 < nodeIndex) {
      throw `TTSPiece: nodeIndex is out of bounds(${nodeIndex}/${nodes.length - 1}).`;
    } else if (nodes[nodeIndex] === null) {
      throw 'TTSPiece: node not found on nodes.';
    } else {
      this._node = nodes[nodeIndex];
      this._nodeIndex = nodeIndex;
    }

    const nodeValue = this._node.nodeValue;
    this._paddingLeft = 0;
    this._text = '';
    if (typeof nodeValue === 'string') {
      if (wordIndex > 0) {
        const words = nodeValue.split(TTSUtil.getSplitWordRegex());
        if (wordIndex < words.length) {
          words.forEach((word, i, list) => {
            if (wordIndex <= i) {
              this._text += `${word}${((i < list.length - 1) ? ' ' : '')}`;
            } else {
              this._paddingLeft += (word.length + 1);
            }
          });
        } else {
          throw `TTSPiece: wordIndex is out of bounds(${wordIndex}/${words.length - 1}).`;
        }
      } else {
        this._text = nodeValue;
      }
    } else if (this._node.nodeName === 'IMG') {
      this._text = this._node.alt || '';
    }
    this._wordIndex = wordIndex;
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
      if (el.style.display === 'none' || el.offsetWidth === 0) {
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
          if (!(valid = (['RUBY', 'RT', 'RP', 'SUB', 'SUP', 'IMG'].indexOf(el.nodeName) === -1))) {
            break;
          }
        } while ((el = el.parentNode));
      }
    }
    return !valid;
  }

  // TopNodeLocation을 작업할 때 br 태그로 newLine이 가능하다는 것을 잊고 있었음;
  // TopNodeLocation이 정식 버전에 들어간 상태라 br 태그를 textAndImageNodes에 포함시킬 수도 없고.. 이런식으로... 허허;
  isNextSiblingToBr() {
    const nNode = this._node.nextSibling;
    return nNode !== null && nNode.nodeName === 'BR';
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
