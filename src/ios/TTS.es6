import _TTS from '../common/tts/_TTS';
import Util from './Util';

export default class TTS extends _TTS {
  getPageOffsetFromChunkId(chunkId) {
    if (app.scrollMode) {
      return null;
    }

    if (app.isBackground()) {
      return null;
    }

    const chunk = this.chunks.getChunkById(chunkId);
    if (!chunk) {
      return null;
    }

    const rect = chunk.getBoundingClientRect();
    const origin = rect.left + window.pageXOffset;
    return Math.floor(origin / app.pageWidthUnit) || null;
  }

  getScrollYOffsetFromChunkId(chunkId) {
    if (!app.scrollMode) {
      return null;
    }

    if (app.isBackground()) {
      return null;
    }

    const chunk = this.chunks.getChunkById(chunkId);
    if (!chunk) {
      return null;
    }

    const rect = chunk.getBoundingClientRect();
    const scrollOffset = rect.top + window.pageYOffset;
    return scrollOffset;
  }

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
