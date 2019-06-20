export default class SpeechRange {
  /**
   * @returns {Number}
   */
  get startOffset() { return this._startOffset; }

  /**
   * @returns {Number}
   */
  get endOffset() { return this._endOffset; }

  /**
   * @param {Number} startOffset
   * @param {Number} endOffset
   */
  constructor(startOffset, endOffset) {
    // chunk._pieces[0]의 text (node.nodeValue가 아님) 의 좌측 끝에서
    // chunk에서 실제 사용할 첫 글자 까지의 offset
    // chunk.getText() === 'ABCD', 첫 piece.text : 0000ABCD -> startOffset = 4;
    this._startOffset = startOffset;
    // chunk._pieces[0]의 text (node.nodeValue가 아님) 의 좌측 끝에서
    // chunk에서 실제 사용할 마지막 글자 까지의 offset
    // chunk.getText() === 'ABCD', 첫 piece.text : 0000ABCD -> endOffset = 8;
    this._endOffset = endOffset;
  }
}
