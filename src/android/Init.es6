import RidiApp from './RidiApp';
import RidiSel from './RidiSel';
import RidiEPub from './RidiEPub';
import RidiHandler from './RidiHandler';
import RidiSearcher from './RidiSearcher';
import RidiUtil from './RidiUtil';

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
