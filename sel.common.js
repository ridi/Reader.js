// sel.common.js

var Sel = function() {};
Sel.prototype = {
    maxLength: 0,
    startContainer: null,
    startOffset: null,
    endContainer: null,
    endOffset: null,

    caretRangeFromPoint: function(/*Number*/x, /*Number*/y, /*String*/expand, /*Boolean*/allowCollapsed) {
        var point = adjustPoint(x, y);
        var range = doc.caretRangeFromPoint(point.x, point.y);
        if (range === null) {
            return null;
        }

        range.expand(expand);
        if (!allowCollapsed && range.collapsed) {
            return null;
        }

        return range;
    },

    isOutOfBounds: function(/*Range*/range) {
        return false;
    },

    startSelectionMode: function(/*Number*/x, /*Number*/y, /*String*/expand) {
        var range = this.caretRangeFromPoint(x, y, expand || 'word', false);
        if (range === null) {
            return false;
        }

        // 처음 선택시에는 붙어있는 특수문자까지 모두 포함시킨다
        this.expandRangeByWord(range);

        this.startContainer = range.startContainer;
        this.startOffset = range.startOffset;
        this.endContainer = range.endContainer;
        this.endOffset = range.endOffset;

        return true;
    },

    changeInitialSelection: function(/*Number*/x, /*Number*/y, /*String*/expand) {
        var range = this.caretRangeFromPoint(x, y, expand || 'word', false);
        if (range === null) {
            return false;
        }

        this.startContainer = range.startContainer;
        this.startOffset = range.startOffset;
        this.endContainer = range.endContainer;
        this.endOffset = range.endOffset;

        return true;
    },

    extendUpperSelection: function(/*Number*/x, /*Number*/y, /*String*/expand) {
        var exRange = this.caretRangeFromPoint(x, y, expand || 'character', true);
        if (exRange === null) {
            return false;
        }

        var containerDiff = this.endContainer.compareDocumentPosition(exRange.startContainer);
        if (containerDiff == Node.DOCUMENT_POSITION_FOLLOWING || (containerDiff === 0 && this.endOffset < exRange.startOffset)) {
            return false;
        }

        if (exRange.startContainer == this.startContainer && exRange.startOffset == this.startOffset) {
            return false;
        }

        // selection이 상위 div 등의 배경에 거친 경우 offset들은 childNode의 index이므로 해당 childNode를 start/end container로 설정한다.
        if (exRange.startContainer.childNodes.length) {
            exRange.setStart(exRange.startContainer.childNodes[exRange.startOffset], 0);
        }
        if (exRange.endContainer.childNodes.length) {
            exRange.setEnd(exRange.endContainer.childNodes[exRange.endOffset], exRange.endContainer.childNodes[exRange.endOffset].textContent.length);
        }

        var range = doc.createRange();
        range.setStart(exRange.startContainer, exRange.startOffset);
        range.setEnd(this.endContainer, this.endOffset);
        if (range.collapsed) {
            return false;
        }

        if (!this.isValidRange(range)) {
            return false;
        }

        this.startContainer = exRange.startContainer;
        this.startOffset = exRange.startOffset;

        return true;
    },

    extendLowerSelection: function(/*Number*/x, /*Number*/y, /*String*/expand) {
        var exRange = this.caretRangeFromPoint(x, y, expand || 'character', true);
        if (exRange === null) {
            return false;
        }

        var containerDiff = this.startContainer.compareDocumentPosition(exRange.endContainer);
        if (containerDiff == Node.DOCUMENT_POSITION_PRECEDING || (containerDiff === 0 && this.startOffset > exRange.endOffset)) {
            return false;
        }
        
        if (exRange.endContainer == this.endContainer && exRange.endOffset == this.endOffset) {
            return false;
        }

        // selection이 상위 div 등의 배경에 거친 경우 offset들은 childNode의 index이므로 해당 childNode를 start/end container로 설정한다.
        if (exRange.startContainer.childNodes.length) {
            exRange.setStart(exRange.startContainer.childNodes[exRange.startOffset], 0);
        }
        if (exRange.endContainer.childNodes.length) {
            exRange.setEnd(exRange.endContainer.childNodes[exRange.endOffset], exRange.endContainer.childNodes[exRange.endOffset].textContent.length);
        }

        if (this.isOutOfBounds(exRange)) {
            return false;
        }

        var range = doc.createRange();
        range.setStart(this.startContainer, this.startOffset);
        range.setEnd(exRange.endContainer, exRange.endOffset);
        if (range.collapsed) {
            return false;
        }

        if (!this.isValidRange(range)) {
            return false;
        }

        this.endContainer = exRange.endContainer;
        this.endOffset = exRange.endOffset;

        return true;
    },

    isValidRange: function(/*Range*/range) {
        if (range.collapsed) {
            return false;
        }

        var length = range.toString().length;
        if (this.maxLength > 0 && length > this.maxLength) {
            app.toast('최대 1,000자까지 선택할 수 있습니다');
            return false;
        }

        return true;
    },

    expandRangeByWord: function(/*Range*/range) {
        var startContainer = range.startContainer;
        if (startContainer.nodeValue === null) {
            return;
        }

        var containerValueLength = startContainer.nodeValue.length;
        var startOffset = range.startOffset;
        var originalOffset = startOffset;

        while (startOffset > 0) {
            if (/^\s/.test(range.toString())) {
                range.setStart(startContainer, startOffset += 1);
                break;
            }
            startOffset -= 1;
            range.setStart(startContainer, startOffset);
        }

        while (originalOffset < containerValueLength) {
            if (/\s$/.test(range.toString())) {
                range.setEnd(startContainer, originalOffset -= 1);
                break;
            }
            originalOffset += 1;
            range.setEnd(startContainer, originalOffset);
        }
    },

    getSelectedRange: function() {
        var range = doc.createRange();
        range.setStart(this.startContainer, this.startOffset);
        range.setEnd(this.endContainer, this.endOffset);
        return range;
    },

    getSelectedSerializedRange: function() {
        return rangy.serializeRange(this.getSelectedRange(), true, body);
    },

    getSelectedRangeRects: function() {
        return getOnlyTextNodeRectsFromRange(this.getSelectedRange());
    },

    getSelectedText: function() {
        return this.getSelectedRange().toString();
    },

};

var RidiSel = function() {};
RidiSel.prototype = new Sel();
