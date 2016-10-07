import _TTS from '../common/tts/_TTS';
import EPub from './EPub';
import Util from './Util';

export default class TTS extends _TTS {
  didPlaySpeech(chunkId) {
    if (this.chunks.isEmpty) {
      return;
    }

    app.moveToChunkId(chunkId);

    const rects = this.chunks.getChunkById(chunkId).getClientRects(true);
    android.onRectOfChunkId(chunkId, Util.rectsToAbsoluteCoord(rects));
  }

  didFinishSpeech(chunkId) {
    if (this.chunks.isEmpty) {
      return;
    }

    const nodes = EPub.getTextAndImageNodes() || [];
    if (!super.didFinishSpeech(chunkId) &&
      nodes.length - 1 === this.processedNodeMaxIndex && this.chunks.last.id === chunkId) {
      android.onUtteranceNotFound();
    }
  }

  didFinishMakeChunks(prevLastChunk) {
    const baseChunkId = (prevLastChunk ? prevLastChunk.id : this.chunks.initialId);
    const lastChunk = this.chunks.last;
    let lastChunkId = -1;
    if (lastChunk && ((lastChunkId = lastChunk.id) - baseChunkId > 0)) {
      for (let id = baseChunkId; id <= lastChunkId; id++) {
        const chunk = this.chunks.getChunkById(id);
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

    const chunk = this.chunks.getChunkById(chunkId);
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

    const chunk = this.chunks.getChunkById(chunkId);
    if (!chunk) {
      return null;
    }

    const rect = chunk.getBoundingClientRect();
    return window.pageYOffset + rect.top;
  }
}
