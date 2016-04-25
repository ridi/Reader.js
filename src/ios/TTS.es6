import _TTS from '../common/tts/_TTS';
import Util from './Util';

export default class TTS extends _TTS {
  getPageOffsetFromChunkId(chunkId) {
    if (app.scrollMode) {
      return null;
    }

    if (this.chunks.length - 1 <= chunkId) {
      return null;
    }

    if (app.isBackground()) {
      return null;
    }

    const chunk = this.chunks[chunkId];
    if (!chunk) {
      return null;
    }

    const rect = chunk.getBoundingClientRect();
    let origin = rect.left;
    if (app.systemMajorVersion >= 8) {
      origin += window.pageXOffset;
    }

    return Math.floor(origin / app.pageWidthUnit) || null;
  }

  getScrollYOffsetFromChunkId(chunkId) {
    if (!app.scrollMode) {
      return null;
    }

    if (this.chunks.length - 1 <= chunkId) {
      return null;
    }

    if (app.isBackground()) {
      return null;
    }

    const chunk = this.chunks[chunkId];
    if (!chunk) {
      return null;
    }

    const rect = chunk.getBoundingClientRect();
    let scrollOffset = rect.top;
    if (app.systemMajorVersion >= 8) {
      scrollOffset += window.pageYOffset;
    }
    return scrollOffset;
  }

  getChunk(chunkId) {
    if (this.chunks.length - 1 < chunkId) {
      return null;
    }
    const utterance = this.chunks[chunkId].getUtterance();
    return JSON.stringify({
      chunkId,
      text: encodeURIComponent(utterance.text)
    });
  }

  getRectsFromChunkId(chunkId) {
    if (app.isBackground()) {
      return '';
    }
    return Util.rectsToAbsoluteCoord(this.chunks[chunkId].getClientRects(true));
  }
}
