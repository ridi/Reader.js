import _Handler from '../common/_Handler';
import Util from './Util';

export default class Handler extends _Handler {
  /**
   * @param {Number} x
   * @param {Number} y
   * @param {Number} rawX
   * @param {Number} rawY
   * @param {Number} canvasWidth
   * @param {Number} canvasHeight
   * @param {Boolean} isVerticalPagingOn
   */
  processSingleTapEvent(x, y, rawX, rawY, canvasWidth, canvasHeight, isVerticalPagingOn) {
    const { location } = window;
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
        const canUseFootnote = href.match(/^file:\/\//gm) !== null &&
          (text.trim().match(Util.getFootnoteRegex()) !== null || footnoteType >= 3.0);
        let payload = `{ "link": "${encodeURIComponent(href)}", ` +
                      `  "rectListCoord": "${rectListCoord}", ` +
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

    if (!this.reader.context.isScrollMode) {
      if (isVerticalPagingOn) {
        if (rawY < canvasHeight / 3) {
          location.href = 'ridi+epub://navigation/viewPageByTopOrLeftTouch';
          return;
        } else if (rawY > (canvasHeight * 2) / 3) {
          location.href = 'ridi+epub://navigation/viewPageByBottomOrRightTouch';
          return;
        }
      } else if (rawX < canvasWidth / 4) {
        location.href = 'ridi+epub://navigation/viewPageByTopOrLeftTouch';
        return;
      } else if (rawX > (canvasWidth * 3) / 4) {
        location.href = 'ridi+epub://navigation/viewPageByBottomOrRightTouch';
        return;
      }
    }
    location.href = 'ridi+epub://navigation/toggleFullscreen';
  }
}
