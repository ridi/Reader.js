import App from './App';
import Sel from './Sel';
import EPub from './EPub';
import Handler from './Handler';
import Searcher from './Searcher';
import Util from './Util';
import TTS from './TTS';
import TTSUtterance from '../common/tts/TTSUtterance';
import TTSUtil from '../common/tts/TTSUtil';

export default function (width, height, systemMajorVersion, selMaxLength, doublePageMode, scrollMode) {
  window.app = new App(width, height, systemMajorVersion, doublePageMode, scrollMode);
  window.sel = new Sel(selMaxLength);
  window.epub = EPub;
  window.handler = Handler;
  window.searcher = Searcher;
  window.util = Util;
  window.tts = new TTS();
  window.TTSUtterance = TTSUtterance;
  window.TTSUtil = TTSUtil;

  EPub.setViewport();
}
