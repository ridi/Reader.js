import _TTS from '../common/tts/_TTS';
import Util from './Util';

export default class TTS extends _TTS {
  getChunk(chunkId) {
    const chunk = this.chunks.getChunkById(chunkId);
    if (!chunk) {
      return null;
    }
    const utterance = chunk.getUtterance();
    return JSON.stringify({
      chunkId,
      text: encodeURIComponent(utterance.text)
    });
  }

  getRectsFromChunkId(chunkId) {
    if (app.isBackground()) {
      return '';
    }

    const chunk = this.chunks.getChunkById(chunkId);
    if (!chunk) {
      return '';
    }

    return Util.rectsToAbsoluteCoord(chunk.getClientRects(true));
  }
}
