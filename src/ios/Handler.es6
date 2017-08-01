import _Handler from '../common/_Handler';
import _EPub from '../common/_EPub';
import Util from './Util';

export default class Handler extends _Handler {
  static isInViewportWidth(x) {
    const startViewportWidth = 0;
    const endViewportWidth = startViewportWidth + document.body.clientWidth;
    return x >= startViewportWidth && x <= endViewportWidth;
  }

  static processSingleTapEvent(x, y, rawX, rawY, canvasWidth, canvasHeight, isVerticalPagingOn) {
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
        let payload = `{ "link": "${encodeURIComponent(href)}", ` +
                      `  "rects": "${rects}", ` +
                      `  "canUseFootnote": "${canUseFootnote}", ` +
                      `  "rawX": "${rawX}", ` +
                      `  "rawY": "${rawY}"`;
        if (footnoteType >= 3.0) {
          payload += `, "title": "${text}" }`;
        } else {
          payload += ' }';
        }
        location.href = `ridi+epub://navigation/anchor?${payload}`;

        return;
      }
    }

    if (!app.scrollMode) {
      if (isVerticalPagingOn) {
        if (rawY < canvasHeight / 3) {
          location.href = 'ridi+epub://navigation/viewPrevPage';
          return;
        } else if (rawY > (canvasHeight * 2) / 3) {
          location.href = 'ridi+epub://navigation/viewNextPage';
          return;
        }
      } else if (rawX < canvasWidth / 4) {
        location.href = 'ridi+epub://navigation/viewPrevPage';
        return;
      } else if (rawX > (canvasWidth * 3) / 4) {
        location.href = 'ridi+epub://navigation/viewNextPage';
        return;
      }
    }
    location.href = 'ridi+epub://navigation/toggleFullscreen';
  }
}

Handler.staticOverride(Handler, _Handler, ['isInViewportWidth']);
