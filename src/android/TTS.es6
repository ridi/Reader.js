import _TTS from '../common/tts/_TTS';
import EPub from './EPub';
import Util from './Util';

export default class TTS extends _TTS {
  constructor() {
    super();
    this._flushed = true;
  }

  didPlaySpeech(chunkId) {
    if (this._flushed) {
      return;
    }

    app.moveToChunkId(chunkId);

    const rects = this.chunks[chunkId].getClientRects(true);
    android.onRectOfChunkId(chunkId, Util.rectsToAbsoluteCoord(rects));
  }

  didFinishSpeech(chunkId) {
    if (this._flushed) {
      return;
    }

    const nodes = EPub.getTextAndImageNodes() || [];
    if (!super.didFinishSpeech(chunkId) &&
      nodes.length === this.maxNodeIndex && this.chunks.length - 1 === chunkId) {
      android.onUtteranceNotFound();
    }
  }

  didFinishMakeChunks(index) {
    this._flushed = true;
    if (this.chunks.length - index > 0) {
      for (let i = index; i < this.chunks.length; i++) {
        const chunk = this.chunks[i];
        android.onUtteranceFound(
          chunk.id,
          chunk.getNodeIndex(),
          chunk.getWordIndex(),
          chunk.getUtterance().text
        );
      }
    } else {
      android.onUtteranceNotFound();
    }
  }

  getPageOffsetFromChunkId(chunkId) {
    if (app.scrollMode) {
      return null;
    }

    if (this.chunks.length - 1 <= chunkId) {
      return null;
    }

    const chunk = this.chunks[chunkId];
    if (!chunk) {
      return null;
    }

    const rect = chunk.getBoundingClientRect();
    const origin = window.pageXOffset + rect.left;
    return Math.floor(origin / app.pageWidthUnit) || null;
  }

  getScrollYOffsetFromChunkId(chunkId) {
    if (app.scrollMode === false) {
      return null;
    }

    if (this.chunks.length - 1 <= chunkId) {
      return null;
    }

    const chunk = this.chunks[chunkId];
    if (!chunk) {
      return null;
    }

    const rect = chunk.getBoundingClientRect();
    return window.pageYOffset + rect.top;
  }
}
