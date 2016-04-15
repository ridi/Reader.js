export default class Searcher {
  static searchText(keyword) {
    if (find(keyword, 0)) { // Case insensitive
      return rangy.serializeRange(getSelection().getRangeAt(0), true, document.body);
    }
    return 'null';
  }

  static textAroundSearchResult(pre, post) {
    const range = getSelection().getRangeAt(0);

    const startOffset = range.startOffset;
    const newStart = Math.max(range.startOffset - pre, 0);

    const endOffset = range.endOffset;
    const newEnd = Math.min(newStart + post, range.endContainer.length);

    range.setStart(range.startContainer, newStart);
    range.setEnd(range.endContainer, newEnd);

    const result = range.toString();
    range.setStart(range.startContainer, startOffset);
    range.setEnd(range.endContainer, endOffset);

    return result;
  }
}
