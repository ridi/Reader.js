import _Handler from '../common/_Handler';
import Util from './Util';

export default class Handler extends _Handler {
  /**
   * @param {Number} x
   * @param {Number} y
   * @param {String} nativePoints
   */
  processSingleTapEvent(x, y, nativePoints) {
    const link = this.getLinkFromPoint(x, y);
    if (link !== null) {
      const href = link.href || '';
      const type = link.type || '';
      if (href.length) {
        const range = document.createRange();
        range.selectNodeContents(link.node);

        const rects = this.reader.rectsToAbsoluteCoord(range.getAdjustedClientRects());
        const footnoteType = type === 'noteref' ? 3.0 : 2.0;
        const text = link.node.textContent || '';
        let canUseFootnote = href.match(/^file:\/\//gm) !== null &&
          (text.trim().match(Util.getFootnoteRegex()) !== null || footnoteType >= 3.0);

        if (canUseFootnote) {
          const src = href.replace(window.location.href, '');
          if (src[0] === '#' || src.match(this.reader.content.src) !== null) {
            const anchor = src.substring(src.lastIndexOf('#') + 1);
            const offset = this.reader.getOffsetFromAnchor(anchor);
            if (this.reader.context.isScrollMode) {
              canUseFootnote = offset >= this.reader.pageYOffset;
            } else {
              canUseFootnote = offset >= this.reader.curPage;
            }
          }
        }

        android.onLinkPressed(href, rects, canUseFootnote, footnoteType >= 3.0 ? text : null);
        return;
      }
    }
    android.onSingleTapEventNotProcessed(nativePoints);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  processImageZoomEvent(x, y) {
    const { content } = this.reader;
    const point = this.reader.adjustPoint(x, y);
    let result = content.getImageFromPoint(point.x, point.y);
    if (result) {
      const { left, top, width, height } = this.reader.rectToAbsolute(result.rect);
      android.onImageFound(result.src, result.id, left, top, width, height);
    } else {
      result = content.getSvgFromPoint(point.x, point.y);
      if (result) {
        const { left, top, width, height } = this.reader.rectToAbsolute(result.rect);
        android.onSvgFound(result.html, result.id, left, top, width, height);
      }
    }
  }
}
