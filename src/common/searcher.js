// searcher.js

var Searcher = function() {};
Searcher.prototype = {
    searchText: function(/*String*/keyword) {
        if (find(keyword, 0)/*Case insensitive*/) {
            return rangy.serializeRange(getSelection().getRangeAt(0), true, body);
        } else {
            return 'null';
        }
    },

    textAroundSearchResult: function(/*Number*/pre, /*Number*/post) {
        var range = getSelection().getRangeAt(0);

        var startOffset = range.startOffset;
        var newStart = range.startOffset - pre;
        if (newStart < 0) {
            newStart = 0;
        }

        var endOffset = range.endOffset;
        var newEnd = newStart + post;
        if (newEnd > range.endContainer.length) {
            newEnd = range.endContainer.length;
        }

        range.setStart(range.startContainer, newStart);
        range.setEnd(range.endContainer, newEnd);

        var result = range.toString();
        range.setStart(range.startContainer, startOffset);
        range.setEnd(range.endContainer, endOffset);

        return result;
    },

    getPageOffsetOfSearchResult: function() {
        var rects = getSelection().getRangeAt(0).getAdjustedClientRects();
        return epub.getPageOffsetFromRect(rects[0]);
    },

};

var RidiSearcher = function() {};
RidiSearcher.prototype = new Searcher();
