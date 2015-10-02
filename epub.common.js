// epub.common.js

function createTextNodeIterator(/*Node*/node) {
    return document.createNodeIterator(
        node,
        NodeFilter.SHOW_TEXT,
        { acceptNode : function (/*Node*/node) {
            return NodeFilter.FILTER_ACCEPT;
        }},
        true
    );
}

var epub = {
    getTotalWidth: function() {
        return document.documentElement.scrollWidth;
    },

    getTotalHeight: function() {
        return document.documentElement.scrollHeight;
    },

    scrollTo: function(/*Number*/offset) {
        if (epub.isScrollMode()) {
            scroll(0, offset);
        } else {
            scroll(offset, 0);
        }
    },

    getImagePathFromPoint: function(/*Number*/x, /*Number*/y) {
        var el = document.elementFromPoint(x, y);
        if (el && el.nodeName == 'IMG') {
            return el.src;
        } else {
            return 'null';
        }
    },

    getSvgElementFromPoint: function(/*Number*/x, /*Number*/y) {
        var el = document.elementFromPoint(x, y);
        if (el) {
            var getSvgInnerHTML = function(/*HTMLElement*/el) {
                // svg 객체는 innerHTML 을 사용할 수 없으므로 아래와 같이 바꿔준다.
                var svgEl = document.createElement('svgElement');
                Array.prototype.slice.call(el.childNodes).forEach(function(node, index) {
                    svgEl.appendChild(node.cloneNode(true));
                });
                return svgEl.innerHTML;
            };

            while (el.nodeName != 'HTML' && el.nodeName != 'BODY') {
                el = el.parentElement;
                if (el.nodeName == 'SVG') {
                    var prefix = '<svg', postfix = '</svg>';
                    for (var i = 0; i < el.attributes.length; i++) {
                        var attr = el.attributes[i];
                        prefix += ' ' + attr.nodeName + '="' + attr.nodeValue + '"';
                    }
                    prefix += '>';
                    return prefix + getSvgInnerHTML(el) + postfix;
                }
            }
        }
        return 'null';
    },

    // 넘겨받은 element가 A태그로 링크가 걸려있는 경우 해당 링크 주소 리턴
    getLinkOfElement: function(/*HTMLElement*/el) {
        while (el) {
            if (el && el.nodeName == 'A') {
                return {node: el, href: el.href, type: (el.attributes['epub:type'] || {value: ''}).value};
            }
            el = el.parentNode;
        }
        return null;
    },

    searchText: function(/*String*/keyword) {
        if (find(keyword, 0)/*Case insensitive*/) {
            var sel = getSelection();
            return rangy.serializeRange(sel.getRangeAt(0), true, document.body);
        } else {
            return 'null';
        }
    },

    textAroundSearchResult: function(/*Number*/pre, /*Number*/post) {
        var sel = getSelection();
        var range = sel.getRangeAt(0);

        var startOffset = range.startOffset;
        var newStart = range.startOffset - pre;
        if (newStart < 0) {
            newStart = 0;
        }

        var endOffset = range.endOffset;
        var newEnd = newStart + post;
        if (newEnd > range.endContainer.length) {
            newEnd = range.endContainer.length;
        }

        range.setStart(range.startContainer, newStart);
        range.setEnd(range.endContainer, newEnd);

        var result = range.toString();
        range.setStart(range.startContainer, startOffset);
        range.setEnd(range.endContainer, endOffset);

        return result;
    },

    getPageOffsetOfSearchResult: function() {
        var rects = getSelection().getRangeAt(0).getClientRects();
        return ridi.getPageOffsetFromElementRect(rects[0]);
    },

    //
    // * 이미지 비율 및 크기 보정
    //   - 제작자가 의도한 이미지 비율 또는 크기를 따르돼 
    //    원본 비율을 붕괴시키거나 원본 크기보다 커지는 경우를 없애기 위함.
    //
    reviseImagesInSpine: function() {

    },

    // element에 붙어 있는 모든 텍스트, 이미지 노드를 구한다.
    findTextAndImageNodes: function(/*HTMLElement*/el) {
        var filter = function(/*Node*/node) {
            // 주의! topNodeLocation의 nodeIndex에 영향을 주는 부분으로 함부로 수정하지 말것.
            return node.nodeType == Node.TEXT_NODE || (node.nodeType == Node.ELEMENT_NODE && node.nodeName == 'IMG');
        };

        var nodes = [];
        if (el === null || el === undefined) {
            return nodes;
        }

        var calledFilter = false;
        var node, walk = document.createTreeWalker(
            el, 
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, 
            { acceptNode: function(/*Node*/node) {
                    calledFilter = true;
                    if (filter(node)) {
                        return NodeFilter.FILTER_ACCEPT;
                    } else {
                        return NodeFilter.FILTER_SKIP;
                    }
                }
            }, 
            false
        );

        // 일부 Webkit에서 NodeFilter 기능이 동작하지 않는 경우가 있다.
        // 동작하지 않을 경우 element에 붙어있는 모든 노드가 끌려옴으로 수동으로 필터링해야 한다.
        while ((node = walk.nextNode())) {
            if (calledFilter) {
                nodes.push(node);
            } else if (filter(node)) {
                nodes.push(node);
            }
        }

        return nodes;
    },

    textAndImageNodes: null,

    getTopNodeLocationOfCurrentPage: function() {

    },

    getPageOffsetOfTopNodeLocation: function(/*Number*/nodeIndex, /*Number*/wordIndex) {

    },

    getScrollOfTopNodeLocation: function(/*Number*/nodeIndex, /*Number*/wordIndex) {

    },

    isScrollMode: function() {
        return ridi.appPassedHeight != epub.getTotalHeight();
    },

};

var ridi = {
    // * Android
    // ex) 14, 17, 19, ... (API level)
    // * iOS
    // ex) 6, 7, 8, ...
    systemMajorVersion: 0,

    appPassedWidth: 0,
    appPassedHeight: 0,

    RB_SELECTION_MAX_LENGTH: 1000,

    // * Android
    // 일부 기기와 Android 2.x에서 window.innerWidth, window.innerHeight를 정확하지 않게 리턴하는 경우를 위한 workaround
    // PagingContext의 width, height 값이 html의 width, height 값으로 세팅된다.
    // [!] 가정 : window.innerWidth == PagingContext.width && window.innerHeight = PagingContext.height
    // * iOS
    // 두 쪽 보기일 때 왼쪽과 오른쪽의 웹뷰 사이즈가 다르기 때문에(Selection 처리 때문에 크기가 다름) 이를 맞춰주기 위한 workaround
    // EPubBookControl의 contentWidth, contentHeight 값이 html의 width, height 값으로 세팅된다.
    // [!] 가정 : window.innerWidth == EPubBookControl.contentWidth && window.innerHeight = EPubBookControl.contentHeight
    setAppPassedInnerSize: function(/*Number*/width, /*Number*/height) {
        ridi.appPassedWidth = width;
        ridi.appPassedHeight = height;
    },

    startSelectionMode: function(/*Number*/x, /*Number*/y) {

    },

    changeInitialSelection: function(/*Number*/x, /*Number*/y) {

    },

    extendUpperSelection: function(/*Number*/x, /*Number*/y) {

    },

    extendLowerSelection: function(/*Number*/x, /*Number*/y) {

    },

    getOffsetOfAnchorElement: function(/*String*/anchor, /*Function*/block) {
        var el = document.getElementById(anchor);
        if (el) {
            var nodeIterator = createTextNodeIterator(el), node, rect, origin;
            if ((node = nodeIterator.nextNode()) !== null) {
                // 첫번째 텍스트만 확인
                var range = document.createRange();
                range.selectNodeContents(node);

                var rects = range.getClientRects();
                if (rects.length > 0) {
                    return block(rects[0], el);
                }
            }

            // 텍스트 노드 없는 태그 자체에 anchor가 걸려있으면
            return block(el.getBoundingClientRect(), el);
        }

        return -1;
    },

    getPageOffsetOfAnchorElement: function(/*String*/anchor) {
        return ridi.getOffsetOfAnchorElement(anchor, function(rect, el) {
            return ridi.getPageOffsetFromElementRect(rect, el);
        });
    },

    getScrollOffsetOfAnchorElement: function(/*String*/anchor) {
        return ridi.getOffsetOfAnchorElement(anchor, function(rect) {
            return rect.top;
        });
    },

    getPageOffsetFromElementRect: function(/*ClientRect*/rect, /*{HTMLElement}*/el) {

    },

    getRangeFromSerializedRange: function(/*String*/serializedRange) {
        var tmpRange = rangy.deserializeRange(serializedRange, document.body);

        var range = document.createRange();
        range.setStart(tmpRange.startContainer, tmpRange.startOffset);
        range.setEnd(tmpRange.endContainer, tmpRange.endOffset);

        tmpRange.detach();

        return range;
    },

    getRectsOfRange: function(/*String*/serializedRange) {

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

    removeOtherPageRects: function(/*ClientRectList*/rects, /*Number*/page) {
        var removedRects = [];
        for (var i = 0; i < rects.length; i++) {
            if (ridi.getPageOffsetFromElementRect(rects[i]) == page) {
                removedRects.push(rects[i]);
            }
        }

        return removedRects;
    },

    getOnlyTextNodeRects: function(/*Range*/range) {
        if (range.startContainer == range.endContainer) {
            var innerText = range.startContainer.innerText;
            if (innerText !== undefined && innerText.length === 0) {
                return [];
            } else {
                return range.getClientRects();
            }
        }

        var nodeIterator = createTextNodeIterator(range.commonAncestorContainer);
        var textNodeRects = [], i;

        var workRange = document.createRange();
        workRange.setStart(range.startContainer, range.startOffset);
        workRange.setEnd(range.startContainer, range.startContainer.length);

        var workRects = workRange.getClientRects();
        for (i = 0; i < workRects.length; i++) {
            textNodeRects.push(workRects[i]);
        }

        var node = null;
        while ((node = nodeIterator.nextNode()) !== null) {
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

            workRange = document.createRange();
            workRange.selectNodeContents(node);

            if (ridi.isWhiteSpaceRange(workRange)) {
                continue;
            }

            var rects = workRange.getClientRects();
            for (i = 0; i < rects.length; i++) {
                textNodeRects.push(rects[i]);
            }
        }

        workRange = document.createRange();
        workRange.setStart(range.endContainer, 0);
        workRange.setEnd(range.endContainer, range.endOffset);

        if (ridi.isWhiteSpaceRange(workRange) === false) {
            workRects = workRange.getClientRects();
            for (i = 0; i < workRects.length; i++) {
                textNodeRects.push(workRects[i]);
            }
        }

        return textNodeRects;
    },

    isWhiteSpaceRange: function(/*Range*/range) {
        return /^\s*$/.test(range.toString());
    },

    rectsToJsonWithRelativeCoord: function(/*ClientRectList*/rects) {
        var result = '';
        for (var i = 0; i < rects.length; i++) {
            var rect = rects[i];
            result += rect.left + ',';
            result += rect.top + ',';
            result += rect.width + ',';
            result += rect.height + ',';
        }

        return result;
    },

    getMatchedStyle : function(/*HTMLElement*/el, /*String*/property, /*Boolean*/recursive) {
        recursive = recursive || false;
        var getMatchedStyle = function(/*HTMLElement*/el, /*String*/property) {
            // element property has highest priority
            var val = el.style.getPropertyValue(property);

            // if it's important, we are done
            if (el.style.getPropertyPriority(property)) {
                return val;
            }

            // get matched rules
            var rules = window.getMatchedCSSRules(el);
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
        while (!(val = getMatchedStyle(target, property))) {
            target = target.parentElement;
            if (target === null || recursive === false) {
                break;
            }
        }
        return val;
    },
};
