import Context from './Context';
import Reader from './Reader';
import Util from './Util';
import TTS from './TTS';
import TTSUtterance from '../common/tts/TTSUtterance';
import TTSUtil from '../common/tts/TTSUtil';

export default function (width, height, gap, doublePageMode, scrollMode, systemMajorVersion, maxSelectionLength) {
  const context = new Context(width, height, gap, doublePageMode, scrollMode, systemMajorVersion, maxSelectionLength);
  window.reader = new Reader(document.documentElement, context);
  window.util = Util;
  window.tts = new TTS(window.reader);
  window.TTSUtterance = TTSUtterance;
  window.TTSUtil = TTSUtil;
}
