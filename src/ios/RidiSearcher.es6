import Searcher from '../common/Searcher';
import RidiEPub from './RidiEPub';

export default class RidiSearcher extends Searcher {
  static getPageOffsetOfSearchResult() {
    const rects = getSelection().getRangeAt(0).getAdjustedClientRects();
    return RidiEPub.getPageOffsetFromRect(rects[0]);
  }
}
