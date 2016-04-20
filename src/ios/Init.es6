import RidiApp from './RidiApp';
import RidiSel from './RidiSel';
import RidiEPub from './RidiEPub';
import RidiHandler from './RidiHandler';
import RidiSearcher from './RidiSearcher';
import RidiUtil from './RidiUtil';
import MutableClientRect from '../common/MutableClientRect';

export default function (width, height, systemMajorVersion, selMaxLength,
                         doublePageMode, scrollMode) {
  window.app = new RidiApp(width, height, systemMajorVersion, doublePageMode, scrollMode);
  window.sel = new RidiSel(selMaxLength);
  window.epub = RidiEPub;
  window.handler = RidiHandler;
  window.searcher = RidiSearcher;
  window.util = RidiUtil;

  RidiEPub.setViewport();
}

function getAdjustedBoundingClientRect() {
  const rect = this.getBoundingClientRect() || new MutableClientRect();
  return RidiUtil.adjustRect(rect);
}

function getAdjustedClientRects() {
  const rects = this.getClientRects() || [];
  return RidiUtil.adjustRects(rects);
}

Range.prototype.getAdjustedBoundingClientRect = getAdjustedBoundingClientRect;
Range.prototype.getAdjustedClientRects = getAdjustedClientRects;

HTMLElement.prototype.getAdjustedBoundingClientRect = getAdjustedBoundingClientRect;
HTMLElement.prototype.getAdjustedClientRects = getAdjustedClientRects;
