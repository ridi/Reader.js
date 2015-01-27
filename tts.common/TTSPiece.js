// TTSPiece

function TTSPiece(/*Number*/nodeIndex, /*Number*/wordIndex) {
  this.init(nodeIndex, wordIndex);
}

TTSPiece.prototype = {
  nodeIndex: null,
  wordIndex: null,

  node: null,
  text: '',
  length: 0,

  paddingLeft: 0,

  init: function(/*Number*/nodeIndex, /*Number*/wordIndex) {
    var that = this;

    var nodes = epub.textAndImageNodes;
    if (typeof nodeIndex !== 'number' || nodeIndex == -1 || nodes === null ||
        nodes.length - 1 < nodeIndex || (this.node = nodes[nodeIndex]) === null) {
      return;
    }

    this.nodeIndex = nodeIndex;
    this.wordIndex = typeof wordIndex === 'number' ? wordIndex : null;

    var nodeValue = this.node.nodeValue;
    if (!this.isImage() && typeof nodeValue == 'string') {
      if (this.wordIndex !== null && this.wordIndex > 0) {
        var words = this.text.split(regexSplitWhitespace());
        if (this.wordIndex < words.length) {
          words.forEach(function(word, i, list) {
            if (that.wordIndex <= i)
              that.text += (word + ((i < list.length - 1) ? ' ' : ''));
            else
              that.paddingLeft += (word.length + 1);
          });
        }
      } else {
        this.text = nodeValue;
      }
    }
    this.length = this.text.length;

    setReadOnly(this, ['nodeIndex', 'wordIndex', 'node', 'text', 'length', 'leftPadding'], true);
  },

  isValid: function() {
    var valid = true, element = (this.node.nodeType == Node.TEXT_NODE ? this.node.parentElement : this.node);
    if (this.text === null || this.length === 0 || element.style.display == 'none' || element.offsetWidth === 0) {
      valid = false;
    } else {
      while (element) {
        // 독음(후리가나)과 첨자는 읽지 않는다
        var nodeName = element.nodeName;
        if (nodeName == 'RUBY' || nodeName == 'RT' || nodeName == 'RP') {
          valid = false;
        } else if (nodeName == 'SUB' || nodeName == 'SUP') {
          valid = false;
        }
        if (!valid)
            break;
        element = element.parentNode;
      }
    }
    return valid;
  },

  // 다음 형제노드가 br 태그인지.
  // textAndImageNodes를 작업할 때 br 태그로 newLine이 가능하다는 것을 잊고 있었음;
  // TopNodeLocation이 정식 버전에 들어간 상태라 br 태그를 textAndImageNodes에 포함시킬 수도 없고.. 이런식으로... 허허;
  isNextSiblingToBr: function() {
    if (this.node === null)
      return false;
    var nextSibling = this.node.nextSibling;
    return nextSibling !== null && nextSibling.nodeName == 'BR';
  },

  isImage: function() {
    return this.node.nodeName == 'IMG';
  },

  isOnlyWhitespace: function() {
    var result = this.text.match(regexWhitespaceAndNewLine(null, '{' + this.length + ',}')) !== null ? true : false;
    var previousSibling = this.node.previousSibling;
    if (result && previousSibling !== null) {
      result = previousSibling.nodeName != 'SPAN';
    }
    return result;
  },

  isSentence: function() {
    regexSentence(null, '$');
    return this.text.trim().match(regexSentence(null, '$')) !== null ? true : false;
  }
};
