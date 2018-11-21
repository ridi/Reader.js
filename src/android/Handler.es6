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

        const rectListCoord = range.getClientRects().bind(this.reader).toNormalize().toAbsoluteCoord();
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

        android.onLinkPressed(href, rectListCoord, canUseFootnote, footnoteType >= 3.0 ? text : null);
        return;
      }
    }
    android.onSingleTapEventNotProcessed(nativePoints);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  processLongTapZoomEvent(x, y) {
    const point = this.reader.normalizePoint(x, y);

    let src = this.reader.content.getImagePathFromPoint(point.x, point.y);
    if (src !== 'null') {
      android.onImageLongTapZoom(src);
    }

    src = this.reader.content.getSvgElementFromPoint(point.x, point.y);
    if (src !== 'null') {
      android.onSvgElementLongTapZoom(src);
    }
  }
}
