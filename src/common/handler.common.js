// handler.common.js

var EventHandler = function() {};
EventHandler.prototype = {
    findAdjacentElements: function(/*Number*/x, /*Number*/y) {
        var n = 4;
        var points = [{x: x, y: y},
                      {x: x - n, y: y - n},
                      {x: x + n, y: y - n},
                      {x: x - n, y: y + n},
                      {x: x + n, y: y + n}];
        var els = [];
        for (var i = 0; i < points.length; i++) {
            var point = points[i];
            var el = doc.elementFromPoint(point.x, point.y);
            if (el) {
                els.push(el);
            }
        }
        return els;
    },

    findLink: function(/*Number*/x, /*Number*/y) {
        var point = adjustPoint(x, y);
        var link = null;
        [].forEach.call(this.findAdjacentElements(point.x, point.y), function(el) {
            link = epub.getLinkFromElement(el);
            if (link !== null) {
                return;
            }
        });
        return link;
    },

    processSingleTapEvent: function() {
        mustOverride('processSingleTapEvent');
    },

    processLongTapZoomEvent: function() {
        mustOverride('processLongTapZoomEvent');
    },

};

var RidiEventHandler = function() {};
RidiEventHandler.prototype = new EventHandler();
