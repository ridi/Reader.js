// handler.common.js

var EventHandler = function() {};
EventHandler.prototype = {
    findLink: function(/*Number*/x, /*Number*/y) {
        var tolerance = 4;
        var point = adjustPoint(x, y);
        for (x = point.x - tolerance; x <= point.x + tolerance; x++) {
            for (y = point.y - tolerance; y <= point.y + tolerance; y++) {
                var el = doc.elementFromPoint(x, y);
                if (el) {
                    var link = epub.getLinkFromElement(el);
                    if (link !== null) {
                        return link;
                    }
                }
            }
        }
        return null;
    },

    processSingleTapEvent: function() {
        mustOverride('processSingleTapEvent');
    },

    processLongTapZoomEvent: function() {
        mustOverride('processLongTapZoomEvent');
    }
};

var RidiEventHandler = function() {};
RidiEventHandler.prototype = new EventHandler();
