import _Handler from '../common/_Handler';
import _EPub from '../common/_EPub';
import Util from './Util';

export default class Handler extends _Handler {
  static processSingleTapEvent(x, y, nativePoints) {
    const link = this.getLinkFromPoint(Util.adjustPoint(x, y));
    if (link !== null) {
      const href = link.href || '';
      const type = link.type || '';
      if (href.length) {
        const range = document.createRange();
        range.selectNodeContents(link.node);

        const rects = Util.rectsToAbsoluteCoord(range.getAdjustedClientRects());

        const footnoteType = type === 'noteref' ? 3.0 : 2.0;
        const text = link.node.textContent || '';
        const canUseFootnote = href.match(/^file:\/\//gm) !== null &&
          (text.trim().match(_EPub.getFootnoteRegex()) !== null || footnoteType >= 3.0);

        android.onLinkPressed(href, rects, canUseFootnote, footnoteType >= 3.0 ? text : null);
        return;
      }
    }
    android.onSingleTapEventNotProcessed(nativePoints);
  }

  static processLongTapZoomEvent(x, y) {
    const point = Util.adjustPoint(x, y);

    let src = _EPub.getImagePathFromPoint(point.x, point.y);
    if (src !== 'null') {
      android.onImageLongTapZoom(src);
    }

    src = _EPub.getSvgElementFromPoint(point.x, point.y);
    if (src !== 'null') {
      android.onSvgElementLongTapZoom(src);
    }
  }
}
