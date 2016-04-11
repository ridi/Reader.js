// sel.ios.js

{
    var prototype = RidiSel.prototype;

    prototype.startSelectionMode = function(/*Number*/x, /*Number*/y) {
        if (Sel.prototype.startSelectionMode.call(this, x, y)) {
            var rects = this.getSelectedRangeRects();
            if (rects.length) {
                return rectsToAbsoluteCoord(rects);
            }
        }
    };

    prototype.changeInitialSelection = function(/*Number*/x, /*Number*/y) {
        if (Sel.prototype.changeInitialSelection.call(this, x, y, 'character')) {
            var rects = this.getSelectedRangeRects();
            if (rects.length) {
                return rectsToAbsoluteCoord(rects);
            }
        }
    };

    prototype.extendUpperSelection = function(/*Number*/x, /*Number*/y) {
        if (Sel.prototype.extendUpperSelection.call(this, x, y)) {
            var rects = this.getSelectedRangeRects();
            return rectsToAbsoluteCoord(rects);
        }
    };

    prototype.extendLowerSelection = function(/*Number*/x, /*Number*/y) {
        if (Sel.prototype.extendLowerSelection.call(this, x, y)) {
            var rects = this.getSelectedRangeRects();
            return rectsToAbsoluteCoord(rects);
        }
    };

}
