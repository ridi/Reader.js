import App from './App';
import Sel from './Sel';
import EPub from './EPub';
import Handler from './Handler';
import Searcher from './Searcher';
import Util from './Util';
import TTS from './TTS';
import TTSUtterance from '../common/tts/TTSUtterance';
import TTSUtil from '../common/tts/TTSUtil';
import MutableClientRect from '../common/MutableClientRect';

export default function (width, height, systemMajorVersion, selMaxLength,
                         doublePageMode, scrollMode, pageOffset) {
  window.app = new App(width, height, systemMajorVersion,
    doublePageMode, scrollMode, pageOffset);
  window.sel = new Sel(selMaxLength);
  window.epub = EPub;
  window.handler = Handler;
  window.searcher = Searcher;
  window.util = Util;
  window.tts = new TTS();
  window.TTSUtterance = TTSUtterance;
  window.TTSUtil = TTSUtil;
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
  return Util.adjustRect(rect);
}

function getAdjustedClientRects() {
  const rects = this.getClientRects() || [];
  return Util.adjustRects(rects);
}

// iOS5.x, Android 4.x 버전에서 getBoundingClientRect가 null을 리턴하는 현상이 있어 직접 구현했다.
Range.prototype.getBoundingClientRect =
  Range.prototype.getBoundingClientRect || getBoundingClientRect;

Range.prototype.getAdjustedBoundingClientRect = getAdjustedBoundingClientRect;
Range.prototype.getAdjustedClientRects = getAdjustedClientRects;

HTMLElement.prototype.getAdjustedBoundingClientRect = getAdjustedBoundingClientRect;
HTMLElement.prototype.getAdjustedClientRects = getAdjustedClientRects;
