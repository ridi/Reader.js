// global.common.js

var win = window;
var doc = document;
var html = doc.documentElement;
var body = doc.body;

var abs = Math.abs;
var ceil = Math.ceil;
var round = Math.round;
var floor = Math.floor;
var min = Math.min;
var max = Math.max;

function init(/*String*/name, /*Class*/Cls) {
    Object.defineProperty(win, name, {value: new Cls(), writable: false, enumerable: true, configurable: true});
}

function mustOverride(/*String*/methodName) {
    throw 'You must override! (' + methodName + ')';
}

function createTextNodeIterator(/*Node*/node) {
    return doc.createNodeIterator(
        node,
        NodeFilter.SHOW_TEXT,
        { acceptNode : function (/*Node*/node) {
            return NodeFilter.FILTER_ACCEPT;
        }},
        true
    );
}

function getMatchedStyle(/*HTMLElement*/el, /*String*/property, /*Boolean*/recursive) {
    recursive = recursive || false;
    var getMatchedStyleInternal = function(/*HTMLElement*/el, /*String*/property) {
        // element property has highest priority
        var val = el.style.getPropertyValue(property);

        // if it's important, we are done
        if (el.style.getPropertyPriority(property)) {
            return val;
        }

        // get matched rules
        var rules = win.getMatchedCSSRules(el);
        if (rules === null) {
            return val;
        }

        // iterate the rules backwards
        // rules are ordered by priority, highest last
        for (var i = rules.length; i --> 0;) {
            var rule = rules[i];

            var important = rule.style.getPropertyPriority(property);

            // if set, only reset if important
            if (val === null || important) {
                val = rule.style.getPropertyValue(property);

                // done if important
                if (important) {
                    break;
                }
            }
        }
        return val;
    };

    var val = null;
    var target = el;
    while (!(val = getMatchedStyleInternal(target, property))) {
        target = target.parentElement;
        if (target === null || recursive === false) {
            break;
        }
    }
    return val;
}

function getOnlyTextNodeRectsFromRange(/*Range*/range) {
    var isWhiteSpaceRange = function(/*Range*/range) {
        return /^\s*$/.test(range.toString());
    };

    var concat = function(/*[ClientRect]*/ary, /*ClientRectList*/rects) {
        [].forEach.call(rects, function(rect) {
            ary.push(rect);
        });
        return ary;
    };

    if (range.startContainer == range.endContainer) {
        var innerText = range.startContainer.innerText;
        if (innerText !== undefined && innerText.length === 0) {
            return [];
        } else {
            return range.getAdjustedClientRects();
        }
    }

    var iterator = createTextNodeIterator(range.commonAncestorContainer);
    var textNodeRects = [];

    var workRange = doc.createRange();
    workRange.setStart(range.startContainer, range.startOffset);
    workRange.setEnd(range.startContainer, range.startContainer.length);
    textNodeRects = concat(textNodeRects, workRange.getAdjustedClientRects());

    var node = null;
    while ((node = iterator.nextNode()) !== null) {
        // startContainer 노드보다 el이 앞에 있으면
        if (range.startContainer.compareDocumentPosition(node) == Node.DOCUMENT_POSITION_PRECEDING ||
            range.startContainer == node) {
            continue;
        }

        // endContainer 뒤로 넘어가면 멈춤
        if (range.endContainer.compareDocumentPosition(node) == Node.DOCUMENT_POSITION_FOLLOWING ||
            range.endContainer == node) {
            break;
        }

        workRange = doc.createRange();
        workRange.selectNodeContents(node);
        if (isWhiteSpaceRange(workRange)) {
            continue;
        }

        textNodeRects = concat(textNodeRects, workRange.getAdjustedClientRects());
    }

    workRange = doc.createRange();
    workRange.setStart(range.endContainer, 0);
    workRange.setEnd(range.endContainer, range.endOffset);
    if (!isWhiteSpaceRange(workRange)) {
        textNodeRects = concat(textNodeRects, workRange.getAdjustedClientRects());
    }

    return textNodeRects;
}

function getRangeFromSerializedRange(/*String*/serializedRange) {
    var tmpRange = rangy.deserializeRange(serializedRange, body);
    var range = doc.createRange();
    range.setStart(tmpRange.startContainer, tmpRange.startOffset);
    range.setEnd(tmpRange.endContainer, tmpRange.endOffset);
    tmpRange.detach();
    return range;
}

function getRectsFromSerializedRange(/*String*/serializedRange) {
    mustOverride('getRectsFromSerializedRange');
}

function rectsToCoord(/*ClientRectList*/rects, /*Boolean*/absolute) {
    var insets = {left: 0, top: 0};
    if (absolute) {
        if (app.isScrollMode()) {
            insets.top = win.pageYOffset;
        } else {
            insets.left = win.pageXOffset;
        }
    }

    var result = '';
    for (var i = 0; i < rects.length; i++) {
        var rect = rects[i];
        result += (rect.left + insets.left) + ',';
        result += (rect.top + insets.top) + ',';
        result += rect.width + ',';
        result += rect.height + ',';
    }
    return result;
}

function rectsToAbsoluteCoord(/*ClientRectList*/rects) {
    return rectsToCoord(rects, true);
}

function rectsToRelativeCoord(/*ClientRectList*/rects) {
    return rectsToCoord(rects, false);
}

var MutableClientRect = function(/*ClientRect*/rect) {
    this.left = rect.left || 0;
    this.top = rect.top || 0;
    this.right = rect.right || 0;
    this.bottom = rect.bottom || 0;
    this.width = rect.width || 0;
    this.height = rect.height || 0;
    return this;
};

function adjustPoint(/*Number*/x, /*Number*/y) {
    return {x: x, y: y};
}

function adjustRect(/*ClientRect*/rect) {
    return new MutableClientRect(rect);
}

function adjustRects(/*ClientRectList*/rects) {
    var newRects = [];
    [].forEach.call(rects, function(rect) {
        newRects.push(adjustRect(rect));
    });
    return newRects;
}

Range.prototype.getAdjustedBoundingClientRect = function() {
    var rect = this.getBoundingClientRect() || new MutableClientRect();
    return adjustRect(rect);
};

Range.prototype.getAdjustedClientRects = function() {
    var rects = this.getClientRects() || [];
    return adjustRects(rects);
};
