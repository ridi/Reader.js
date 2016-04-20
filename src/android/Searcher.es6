import _Searcher from '../common/_Searcher';
import EPub from './EPub';

export default class Searcher extends _Searcher {
  static getPageOffsetOfSearchResult() {
    const rects = getSelection().getRangeAt(0).getAdjustedClientRects();
    return EPub.getPageOffsetFromRect(rects[0]);
  }
}
