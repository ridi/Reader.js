export default class TTSChunkCollection {
  get length() { return this._chunks.length; }
  get isEmpty() { return this.length === 0; }
  get first() { return this._chunks[0]; }
  get last() { return this._chunks[this.length - 1]; }
  get oneSideReserveCapacity() { return 250; }
  get initialId() { return 0; }

  constructor() {
    // previous chunks + next chunks + current chunk
    this._capacity = 2 * this.oneSideReserveCapacity + 1;
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
    if (this.length >= this._capacity) {
      this.last.id = NaN;
      this._chunks.pop();
    }
    this._chunks.unshift(newChunk);
  }

  pushLast(chunk) {
    const newChunk = chunk;
    newChunk.id = (this.last ? (this.last.id + 1) : this.initialId);
    if (this.length >= this._capacity) {
      this.first.id = NaN;
      this._chunks.shift();
    }
    this._chunks.push(newChunk);
  }

  getChunkById(chunkId) {
    return this._chunks[this._indexByChunkId(chunkId)];
  }
}
