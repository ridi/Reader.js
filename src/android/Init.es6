import RidiApp from './RidiApp';
import RidiSel from './RidiSel';
import RidiEPub from './RidiEPub';
import RidiHandler from './RidiHandler';
import RidiSearcher from './RidiSearcher';
import RidiUtil from './RidiUtil';
import MutableClientRect from '../common/MutableClientRect';

export default function (width, height, systemMajorVersion, selMaxLength,
                         doublePageMode, scrollMode, pageOffset) {
  window.app = new RidiApp(width, height, systemMajorVersion,
    doublePageMode, scrollMode, pageOffset);
  window.sel = new RidiSel(selMaxLength);
  window.epub = RidiEPub;
  window.handler = RidiHandler;
  window.searcher = RidiSearcher;
  window.util = RidiUtil;
}

function getBoundingClientRect() {
  const rects = this.getClientRects();
  if (rects === null) {
    return null;
  }

  const bounds = new MutableClientRect();
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    bounds.top = Math.min(bounds.top, rect.top || 0);
    bounds.bottom = Math.max(bounds.bottom, rect.bottom || 0);
    bounds.left = Math.min(bounds.left, rect.left || 0);
    bounds.right = Math.max(bounds.right, rect.right || 0);
  }
  bounds.width = Math.max(bounds.right - bounds.left, 0);
  bounds.height = Math.max(bounds.bottom - bounds.top, 0);

  return bounds;
}

function getAdjustedBoundingClientRect() {
  const rect = this.getBoundingClientRect() || new MutableClientRect();
  return RidiUtil.adjustRect(rect);
}

function getAdjustedClientRects() {
  const rects = this.getClientRects() || [];
  return RidiUtil.adjustRects(rects);
}

// iOS5.x, Android 4.x 버전에서 getBoundingClientRect가 null을 리턴하는 현상이 있어 직접 구현했다.
Range.prototype.getBoundingClientRect =
  Range.prototype.getBoundingClientRect || getBoundingClientRect;

Range.prototype.getAdjustedBoundingClientRect = getAdjustedBoundingClientRect;
Range.prototype.getAdjustedClientRects = getAdjustedClientRects;

HTMLElement.prototype.getAdjustedBoundingClientRect = getAdjustedBoundingClientRect;
HTMLElement.prototype.getAdjustedClientRects = getAdjustedClientRects;
