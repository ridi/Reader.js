import _TTS from '../common/tts/_TTS';
import Util from './Util';

export default class TTS extends _TTS {
  get makeChunksFinished() { return this._makeChunksFinished; }

  constructor() {
    super();
    this._makeChunksFinished = false;
    this._chunkSetsForPolling = [];
    this._temporalChunk = null;
  }

  pollChunks() {
    // Polling이 이루어지는 시점에 chunkSet들은 만들어진 순서대로 들어있다.
    // 즉, chunk를 만들기 시작한 (nodeIndex, wordIndex)에 근접한 chunkSet부터 들어있다.
    // (makeAdjacentChunksByNodeLocation 참고)
    const chunkSetsForPolling = this._chunkSetsForPolling;
    this._chunkSetsForPolling = [];
    return JSON.stringify(chunkSetsForPolling);
  }

  pollTemporalChunk() {
    const temporalChunk = this._temporalChunk;
    this._temporalChunk = null;
    return JSON.stringify(temporalChunk);
  }

  didFinishMakePartialChunks(isMakingTemporalChunk, addAtFirst, startPlay = true) {
    if (!isMakingTemporalChunk) {
      this._chunkSetsForPolling.push({ addAtFirst, chunks: this.chunks.map((chunk) => chunk.toJSONForNative()) });
    } else if (this.chunks.length > 0) {
      this._temporalChunk = this.chunks.pop().toJSONForNative();
    }
    this._chunks = [];
  }

  didFinishMakeChunks() {
    if (this._didFinishMakeChunksEnabled) {
      this._makeChunksFinished = true;
      this._didFinishMakeChunksEnabled = false;
    }
  }

  flush() {
    super.flush();
    this._makeChunksFinished = false;
    this._chunkSetsForPolling = [];
    this._temporalChunk = null;
  }
}
