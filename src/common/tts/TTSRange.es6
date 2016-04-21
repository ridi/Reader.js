export default class TTSRange {
  get startOffset() { return this._startOffset; }
  get endOffset() { return this._endOffset; }

  constructor(startOffset, endOffset) {
    this._startOffset = startOffset;
    this._endOffset = endOffset;
  }
}
