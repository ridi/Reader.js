// TTSPiece

function TTSPiece(/*Number*/nodeIndex, /*Number*/wordIndex) {
  this.init(nodeIndex, wordIndex);
}

TTSPiece.prototype = {
  nodeIndex: -1,
  wordIndex: -1,

  node: null,
  text: '',
  length: 0,

  paddingLeft: 0,

  init: function(/*Number*/nodeIndex, /*Number*/wordIndex) {
    if (nodeIndex === undefined || typeof nodeIndex !== 'number' || nodeIndex < 0)
      throw 'TTSPiece: nodeIndex is invalid.';

    var nodes = epub.textAndImageNodes;
    if (nodes === null)
      throw 'TTSPiece: nodes is empty. make call epub.findTextAndImageNodes().';
    else if (nodes.length - 1 < nodeIndex)
      throw 'TTSPiece: nodeIndex is out of bounds(' + nodeIndex + '/' + nodes.length + ').';
    else if ((this.node = nodes[nodeIndex]) === null)
      throw 'TTSPiece: node not found on nodes.';

    this.nodeIndex = nodeIndex;
    this.wordIndex = wordIndex = typeof wordIndex === 'number' ? wordIndex : 0;

    var nodeValue = this.node.nodeValue,
        text = '', padding = 0;
    if (typeof nodeValue == 'string') {
      if (wordIndex > 0) {
        var words = nodeValue.split(regexSplitWhitespace());
        if (wordIndex < words.length) {
          words.forEach(function(word, i, list) {
            if (wordIndex <= i)
              text += (word + ((i < list.length - 1) ? ' ' : ''));
            else
              padding += (word.length + 1);
          });
        } else
          throw 'TTSPiece: wordIndex is out of bounds(' + wordIndex + '/' + words.length + ').';
      } else
        text = nodeValue;
    }
    this.text = text;
    this.length = text.length;
    this.paddingLeft = padding;

    setReadOnly(this, ['nodeIndex', 'wordIndex', 'node', 'text', 'length', 'leftPadding'], true);
  },

  isInvalid: function() {
    var node = this.node, 
        valid = true,
        element = (node.nodeType == Node.TEXT_NODE ? node.parentElement : node);
    // 텍스트가 없거나 눈에 보이지 않는 것은 읽지 않는다
    if (this.length === 0 || element.style.display == 'none' || element.offsetWidth === 0) {
      valid = false;
    } else {
      do {// 이미지, 독음(후리가나)과 첨자는 읽지 않는다
        if (!(valid = (['RUBY', 'RT', 'RP', 'SUB', 'SUP', 'IMG'].indexOf(element.nodeName) == -1)))
          break;
      } while ((element = element.parentNode));
    }
    return !valid;
  },

  // TopNodeLocation을 작업할 때 br 태그로 newLine이 가능하다는 것을 잊고 있었음;
  // TopNodeLocation이 정식 버전에 들어간 상태라 br 태그를 textAndImageNodes에 포함시킬 수도 없고.. 이런식으로... 허허;
  isNextSiblingToBr: function() {
    var nNode = this.node.nextSibling;
    return nNode !== null && nNode.nodeName == 'BR';
  },

  isOnlyWhitespace: function() {
    var only = this.text.match(regexWhitespaceAndNewLine(null, '{' + this.length + ',}')) !== null ? true : false;
    var pNode = this.node.previousSibling;
    if (only && pNode !== null)
      only = pNode.nodeName != 'SPAN';
    return only;
  },

  isSentence: function() {
    return this.text.trim().match(regexSentence(null, '$')) !== null ? true : false;
  }
};
