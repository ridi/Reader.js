// sel.android.js

{
    var prototype = RidiSel.prototype;

    prototype.isOutOfBounds = function(/*Range*/range) {
        // 화면 하단 바깥쪽으로 드레그 했을 때 viewport 밖인데도 caretRangeFromPoint로 노드를 잡을 수 있어
        // 하이라이트가 뒷페이지까지 이어지는 문제가 발생하고 있다(Android 4.x~)
        // 이를 해결하기 위해 caretRangeFromPoint로 잡은 Range의 left가 현재 페이지를 벗어났는지를 확인한다
        var pageWidth = getStylePropertyIntValue(html, 'width');
        var testRange = doc.createRange();
        testRange.selectNode(range.endContainer);
        var testRect = testRange.getAdjustedBoundingClientRect();
        return testRect.left > pageWidth;
    };

    prototype.startSelectionMode = function(/*Number*/x, /*Number*/y) {
        if (Sel.prototype.startSelectionMode.call(this, x, y)) {
            var rects = this.getSelectedRangeRects();
            if (rects.length) {
                android.onStartSelectionMode(rectsToAbsoluteCoord(rects));
            }
        }
    };

    prototype.changeInitialSelection = function(/*Number*/x, /*Number*/y) {
        if (Sel.prototype.changeInitialSelection.call(this, x, y)) {
            var rects = this.getSelectedRangeRects();
            if (rects.length) {
                android.onInitialSelectionChanged(rectsToAbsoluteCoord(rects));
            }
        }
    };

    prototype.extendUpperSelection = function(/*Number*/x, /*Number*/y) {
        if (Sel.prototype.extendUpperSelection.call(this, x, y)) {
            var rects = this.getSelectedRangeRects();
            android.onSelectionChanged(rectsToAbsoluteCoord(rects), this.getSelectedText());
        }
    };

    prototype.extendLowerSelection = function(/*Number*/x, /*Number*/y) {
        if (Sel.prototype.extendLowerSelection.call(this, x, y)) {
            var rects = this.getSelectedRangeRects();
            android.onSelectionChanged(rectsToAbsoluteCoord(rects), this.getSelectedText());
        }
    };

    prototype.requestSelectionInfo = function() {
        android.onSelectionInfo(this.getSelectedSerializedRange(), this.getSelectedText());
    };

}
