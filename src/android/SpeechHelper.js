import _SpeechHelper from '../common/_SpeechHelper';

export default class SpeechHelper extends _SpeechHelper {
  /**
   * @param {Boolean} isMakingTemporalChunk
   * @param {Boolean} addAtFirst
   */
  didFinishMakePartialChunks(isMakingTemporalChunk, addAtFirst) {
    while (this.chunks.length > 0) {
      // this.chunks에는 항상 chunk들이 본문에서의 순서대로 들어있다.
      const chunk = (addAtFirst ? this.chunks.pop() : this.chunks.shift());
      const info = this.getChunkInfo(chunk);
      android.onUtteranceFound(
        info.nodeIndex,
        info.wordIndex,
        info.text,
        info.rectListCoord,
        isMakingTemporalChunk,
        addAtFirst,
      );
    }
  }

  didFinishMakeChunks() {
    if (super.didFinishMakeChunks()) {
      android.onFinishMakeChunks();
    }
  }
}
