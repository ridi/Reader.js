import Handler from '../common/Handler';
import RidiUtil from './RidiUtil';
import RidiEPub from './RidiEPub';

export default class RidiHandler extends Handler {
  static processSingleTapEvent(x, y, nativePoints) {
    const link = this.getLinkFromPoint(RidiUtil.adjustPoint(x, y));
    if (link !== null) {
      const href = link.href || '';
      const type = link.type || '';
      if (href.length) {
        const range = document.createRange();
        range.selectNodeContents(link.node);

        const rects = RidiUtil.rectsToAbsoluteCoord(range.getAdjustedClientRects());

        const footnoteType = type === 'noteref' ? 3.0 : 2.0;
        const text = link.node.textContent || '';
        const regex = /^(\[|\{|\(|주|)[0-9]*(\)|\}|\]|\.|)$/gm;
        const canUseFootnote = href.match(/^file:\/\//gm) !== null &&
          (text.trim().match(regex) !== null || footnoteType >= 3.0);

        android.onLinkPressed(href, rects, canUseFootnote, footnoteType >= 3.0 ? text : null);
        return;
      }
    }
    android.onSingleTapEventNotProcessed(nativePoints);
  }

  static processLongTapZoomEvent(x, y) {
    const point = RidiUtil.adjustPoint(x, y);

    let src = RidiEPub.getImagePathFromPoint(point.x, point.y);
    if (src !== 'null') {
      android.onImageLongTapZoom(src);
    }

    src = RidiEPub.getSvgElementFromPoint(point.x, point.y);
    if (src !== 'null') {
      android.onSvgElementLongTapZoom(src);
    }
  }
}
