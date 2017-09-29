import _TTS from '../common/tts/_TTS';

export default class TTS extends _TTS {
  /**
   * @param {Boolean} isMakingTemporalChunk
   * @param {Boolean} addAtFirst
   */
  didFinishMakePartialChunks(isMakingTemporalChunk, addAtFirst) {
    while (this.chunks.length > 0) {
      // this.chunks에는 항상 chunk들이 본문에서의 순서대로 들어있다.
      const chunk = (addAtFirst ? this.chunks.pop() : this.chunks.shift());
      android.onUtteranceFound(chunk.getStartNodeIndex(),
        chunk.getStartWordIndex(),
        chunk.getUtterance().text,
        this.reader.rectsToAbsoluteCoord(chunk.getClientRects(true)),
        isMakingTemporalChunk,
        addAtFirst);
    }
  }

  didFinishMakeChunks() {
    if (super.didFinishMakeChunks()) {
      android.onFinishMakeChunks();
    }
  }
}
