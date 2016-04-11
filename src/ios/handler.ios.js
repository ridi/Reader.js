// handler.ios.js

{
    var prototype = RidiEventHandler.prototype;

    prototype.processSingleTapEvent = function(/*Number*/x, /*Number*/y, /*Number*/rawX, /*Number*/rawY, /*Number*/canvasWidth, /*Number*/canvasHeight, /*Boolean*/isVerticalPagingOn) {
        var link = this.findLink(x, y);
        if (link !== null) {
            var href = link.href || '';
            var type = link.type || '';
            if (href.length) {
                var range = doc.createRange();
                range.selectNodeContents(link.node);
                var rects = rectsToAbsoluteCoord(range.getAdjustedClientRects());

                var footnoteType = link.type == 'noteref' ? 3.0 : 2.0;
                var text = link.node.textContent;
                var canUseFootnote = link.href.match(/^file:\/\//gm) !== null &&
                                     (text.trim().match(/^(\[|\{|\(|주|)[0-9]*(\)|\}|\]|\.|)$/gm) !== null || footnoteType >= 3.0);

                var payload = '{ "link": "' + encodeURIComponent(link.href) + '", ' +
                                '"rects": "' + rects + '", ' +
                                '"canUseFootnote": "' + canUseFootnote + '", ' +
                                (footnoteType >= 3.0 ? '"title": "' + text + '", ' : '') +
                                '"rawX": "' + rawX + '", "rawY": "' + rawY + '" }';
                location.href = 'ridi+epub://navigation/anchor?' + payload;

                return;
            }
        }

        if (!app.scrollMode) {
            if (isVerticalPagingOn) {
                if (rawY < canvasHeight / 3) {
                    location.href = 'ridi+epub://navigation/viewPrevPage';
                    return;
                } else if (rawY > canvasHeight * 2 / 3) {
                    location.href = 'ridi+epub://navigation/viewNextPage';
                    return;
                }
            } else {
                if (rawX < canvasWidth / 4) {
                    location.href = 'ridi+epub://navigation/viewPrevPage';
                    return;
                } else if (rawX > canvasWidth * 3 / 4) {
                    location.href = 'ridi+epub://navigation/viewNextPage';
                    return;
                }
            }
        }
        location.href = 'ridi+epub://navigation/toggleFullscreen';
    };

}
