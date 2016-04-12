// tts.android.js

{
    var prototype = RidiTTS.prototype;

    prototype.getPageOffsetFromChunkId = function(/*Number*/chunkId) {
        if (app.scrollMode) {
            return NOT_FOUND;
        }

        if (this.chunks.length - 1 <= chunkId) {
            return NOT_FOUND;
        }

        var chunk = this.chunks[chunkId];
        if (!chunk) {
            return NOT_FOUND;
        }

        var rect = chunk.getBoundingClientRect();
        var origin = win.pageXOffset + rect.left;
        var pageOffset = floor(origin / app.pageWidthUnit);
        if (isNaN(pageOffset)) {
            pageOffset = NOT_FOUND;
        }
        return pageOffset;
    };

    prototype.getScrollYOffsetFromChunkId = function(/*Number*/chunkId) {
        if (app.scrollMode === false) {
            return NOT_FOUND;
        }

        if (this.chunks.length - 1 <= chunkId) {
            return NOT_FOUND;
        }

        var chunk = this.chunks[chunkId];
        if (!chunk) {
            return NOT_FOUND;
        }

        var rect = chunk.getBoundingClientRect();
        return win.pageYOffset + rect.top;
    };

    prototype.didPlaySpeech = function(/*Number*/chunkId) {
        if (this.flushed) {
            return;
        }

        app.moveToChunkId(chunkId);

        var rects = this.chunks[chunkId].getClientRects(true);
        android.onRectOfChunkId(chunkId, rectsToAbsoluteCoord(rects));
    };

    prototype.didFinishSpeech = function(/*Number*/chunkId) {
        if (this.flushed) {
            return;
        }

        var chunks = this.chunks;
        var length = epub.textAndImageNodes.length;
        if (length > this.maxNodeIndex) {
            var curChunk = chunks[chunkId];
            var lastChunk = chunks[chunks.length - 1];
            if (curChunk !== null && lastChunk !== null) {
                var curPiece = curChunk.getPiece(curChunk.range.endOffset),
                lastPiece = lastChunk.getPiece(lastChunk.range.endOffset);
                if (max(lastPiece.nodeIndex - 30, 0) < curPiece.nodeIndex) {
                    this.makeChunksByNodeLocation(lastPiece.nodeIndex + 1, 0);
                }
            }
        } else if (length == this.maxNodeIndex && chunks.length - 1 == chunkId) {
            android.onUtteranceNotFound();
        }
    };

    prototype.didFinishMakeChunks = function(/*Number*/index) {
        this.flushed = false;
        var chunks = this.chunks;
        if (chunks.length - index > 0) {
            for (var i = index; i < chunks.length; i++) {
                var chunk = chunks[i];
                android.onUtteranceFound(chunk.id, chunk.getNodeIndex(), chunk.getWordIndex(), chunk.getUtterance().text);
            }
        } else {
            android.onUtteranceNotFound();
        }
    };

    prototype.flushed = true;

    prototype.flush = function() {
        this.chunks = [];
        this.maxNodeIndex = 0;
        this.flushed = true;
    };

}
