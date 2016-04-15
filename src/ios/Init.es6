import RidiApp from './RidiApp';
import RidiSel from './RidiSel';
import RidiEPub from './RidiEPub';
import RidiHandler from './RidiHandler';
import RidiSearcher from './RidiSearcher';
import RidiUtil from './RidiUtil';

export default function (width, height, systemMajorVersion, selMaxLength) {
  window.app = new RidiApp(width, height, systemMajorVersion);
  window.sel = new RidiSel(selMaxLength);
  window.epub = RidiEPub;
  window.handler = RidiHandler;
  window.searcher = RidiSearcher;
  window.util = RidiUtil;

  RidiEPub.setViewport();
}
