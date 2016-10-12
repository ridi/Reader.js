export default class TTSChunkCollection {
  get length() { return this._chunks.length; }
  get isEmpty() { return this.length === 0; }
  get first() { return this._chunks[0]; }
  get last() { return this._chunks[this.length - 1]; }
  get initialId() { return 0; }
  get oneSideReserveCapacity() { return this._oneSideReserveCapacity; }

  constructor() {
    this._oneSideReserveCapacity = 250;
    // TODO : 용량을 실제로 제한하고 있지는 않다.
    // previous chunks + next chunks + current chunk
    this._capacity = 2 * this._oneSideReserveCapacity + 1;
    this._chunks = [];
  }

  clear() {
    const length = this.length;
    for (let i = 0; i < length - 1; i++) {
      this._chunks[i].id = NaN;
    }
    this._chunks = [];
  }

  _indexByChunkId(chunkId) {
    return this.first ? (chunkId - this.first.id) : -1;
  }

  pushFirst(chunk) {
    const newChunk = chunk;
    newChunk.id = (this.first ? (this.first.id - 1) : this.initialId);
    this._chunks.unshift(newChunk);
  }

  pushLast(chunk) {
    const newChunk = chunk;
    newChunk.id = (this.last ? (this.last.id + 1) : this.initialId);
    this._chunks.push(newChunk);
  }

  getChunkById(chunkId) {
    return this._chunks[this._indexByChunkId(chunkId)];
  }
}
