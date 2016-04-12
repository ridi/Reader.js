// handler.android.js

{
    var prototype = RidiEventHandler.prototype;

    prototype.processSingleTapEvent = function(/*Number*/x, /*Number*/y, /*String*/nativePoints) {
        var link = this.findLink(x, y);
        if (link !== null) {
            var href = link.href || '';
            var type = link.type || '';
            if (href.length ) {
                var range = doc.createRange();
                range.selectNodeContents(link.node);
                var rects = rectsToAbsoluteCoord(range.getAdjustedClientRects());

                var footnoteType = type == 'noteref' ? 3.0 : 2.0;
                var text = link.node.textContent;
                var canUseFootnote = href.match(/^file:\/\//gm) !== null &&
                                     (text.trim().match(/^(\[|\{|\(|주|)[0-9]*(\)|\}|\]|\.|)$/gm) !== null || footnoteType >= 3.0);

                android.onLinkPressed(href, rects, canUseFootnote, footnoteType >= 3.0 ? text : null);
                return;
            }
        }
        android.onSingleTapEventNotProcessed(nativePoints);
    };

    prototype.processLongTapZoomEvent = function(/*Number*/x, /*Number*/y) {
        var point = adjustPoint(x, y);

        var src = epub.getImagePathFromPoint(point.x, point.y);
        if (src !== 'null') {
            android.onImageLongTapZoom(src);
        }

        src = epub.getSvgElementFromPoint(point.x, point.y);
        if (src !== 'null') {
            android.onSvgElementLongTapZoom(src);
        }
    };

}
