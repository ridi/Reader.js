// tts.ios.js

{
  var prototype = RidiTTS.prototype;

  prototype.getPageOffsetOfChunkId = function(/*Number*/chunkId) {
    if (app.scrollMode) {
      return NOT_FOUND;
    }

    if (this.chunks.length - 1 <= chunkId) {
      return NOT_FOUND;
    }

    if (app.appInBackground) {
      return NOT_FOUND;
    }

    var chunk = this.chunks[chunkId];
    if (chunk === undefined) {
      return NOT_FOUND;
    }

    var rect = chunk.getBoundingClientRect();
    var origin = rect.left;
    if (app.systemMajorVersion >= 8) {
      origin += win.pageXOffset;
    }

    var pageOffset = floor(origin / app.pageWidthUnit);
    if (isNaN(pageOffset)) {
      pageOffset = -1;
    }
    return pageOffset;
  };

  prototype.getScrollYOffsetOfChunkId = function(/*Number*/chunkId) {
    if (!app.scrollMode) {
      return NOT_FOUND;
    }

    if (this.chunks.length - 1 <= chunkId) {
      return NOT_FOUND;
    }

    if (app.appInBackground) {
      return NOT_FOUND;
    }

    var chunk = this.chunks[chunkId];
    if (chunk === undefined) {
      return NOT_FOUND;
    }

    var rect = chunk.getBoundingClientRect();
    var scrollOffset = rect.top;
    if (app.systemMajorVersion >= 8) {
      scrollOffset += win.pageYOffset;
    }
    return scrollOffset;
  };

  prototype.didPlaySpeech = function(/*Number*/chunkId) {};

  prototype.didFinishSpeech = function(/*Number*/chunkId) {
    if (epub.textAndImageNodes.length > this.maxNodeIndex) {
      var curChunk = this.chunks[chunkId];
      var lastChunk = this.chunks[this.chunks.length - 1];
      if (curChunk !== null && lastChunk !== null) {
        var curPiece = curChunk.getPiece(curChunk.range.endOffset);
        var lastPiece = lastChunk.getPiece(lastChunk.range.endOffset);
        if (max(lastPiece.nodeIndex - 30, 0) < curPiece.nodeIndex) {
          this.makeChunksByNodeLocation(lastPiece.nodeIndex + 1, 0);
        }
      }
    }
  };

  prototype.didFinishMakeChunks = function(/*Number*/index) {};

  prototype.flush = function() {
    this.chunks = [];
    this.maxNodeIndex = 0;
  };

  prototype.getChunk = function(/*Number*/chunkId) {
    if (this.chunks.length - 1 < chunkId) {
      return null;
    }
    var utterance = this.chunks[chunkId].getUtterance();
    return JSON.stringify({chunkId: chunkId, text: encodeURIComponent(utterance.text)});
  };

  prototype.getRectsOfChunkId = function(/*Number*/chunkId) {
    if (app.appInBackground) {
      return '';
    } else {
      return rectsToAbsoluteCoord(this.chunks[chunkId].getClientRects(true));
    }
  };
}
