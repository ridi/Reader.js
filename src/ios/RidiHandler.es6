import Handler from '../common/Handler';
import RidiUtil from './RidiUtil';

export default class RidiHandler extends Handler {
  static processSingleTapEvent(x, y, rawX, rawY, canvasWidth, canvasHeight, isVerticalPagingOn) {
    const link = this.getLink(x, y);
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
        } else if (rawY > canvasHeight * 2 / 3) {
          location.href = 'ridi+epub://navigation/viewNextPage';
          return;
        }
      } else {
        if (rawX < canvasWidth / 4) {
          location.href = 'ridi+epub://navigation/viewPrevPage';
          return;
        } else if (rawX > canvasWidth * 3 / 4) {
          location.href = 'ridi+epub://navigation/viewNextPage';
          return;
        }
      }
    }
    location.href = 'ridi+epub://navigation/toggleFullscreen';
  }
}
