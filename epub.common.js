// epub.common.js

var epub = {
    setForegroundColor : function(color) {
        document.body.style.color = color;
    },
    
    totalWidth : function() {
        return document.documentElement.scrollWidth;
    },

    imagePathFromPoint : function(x, y) {
        var element = document.elementFromPoint(x, y);
        if (element && element.nodeName == 'IMG') {
            return element.src;
        }
        else {
            return 'null';
        }
    },

    // 넘겨받은 element가 A태그로 링크가 걸려있는 경우 해당 링크 주소 리턴
    getLinkOfElement : function(element) {
        while (element) {
            if (element && element.nodeName == 'A') {
                return element.href;
            }
            
            element = element.parentNode;
        }
        
        return null;
    },

    searchText : function (keyword) {
        var result = window.find(keyword, 0);   // case insensitive
        if (result) {
            var sel = document.getSelection();
            return rangy.serializeRange(sel.getRangeAt(0), true, document.body);
        }
        else {
            return 'null';
        }
    },

    textAroundSearchResult : function (pre, post) {
        var sel = window.getSelection();
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

    pageOffsetOfSearchResult : function() {
        var sel = window.getSelection();
        var range = sel.getRangeAt(0);
        var rects = range.getClientRects();
        
        return ridi.getPageFromElementRect(rects[0]);
    },

    //
    // * 이미지 비율 및 크기 보정
    //   - 제작자가 의도한 이미지 비율 또는 크기를 따르돼 
    //    원본 비율을 붕괴시키거나 원본 크기보다 커지는 경우를 없애기 위함.
    //
    reviseImagesInSpine : function(canvasWidth, canvasHeight) {

    },

    // element에 붙어 있는 모든 텍스트, 이미지 노드를 구한다.
    findTextAndImageNodes: function(element) {
        var filter = function(node) {
            // 주의! topNodeLocation의 nodeIndex에 영향을 주는 부분으로 함부로 수정하지 말것.
            return node.nodeType == Node.TEXT_NODE || (node.nodeType == Node.ELEMENT_NODE && node.nodeName.toLowerCase() == "img");
        };

        var nodes = [];
        if (element === null || typeof element === 'undefined') {
            return nodes;
        }

        var calledFilter = false;
        var node = null, walk = document.createTreeWalker(
            element, 
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, 
            {
                acceptNode: function(node) {
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

    // element의 rect 계산 기준이 spine의 시작일 경우: startOffset = scrollLeft, endOffset = scrollLeft + canvasWidth (iOS 7.x)
    // element의 rect 계산 기준이 현재 offset일 경우: startOffset = 0, endOffset = canvasWidth (iOS 7.x under, Android 4.x Later)
    // -webkit-column 구현 기준이 left일 경우: basedLeft = true (iOS All, Android 3.x Later)
    // -webkit-column 구현 기준이 top일 경우: basedLeft = false (Android 2.x)
    getTopNodeLocationOfCurrentPage : function(startOffset, endOffset, basedLeft) {

    },

    getPageOffsetFromLocation: function(canvasWidth, canvasHeight, nodeIndex, wordIndex, basedLeft) {

    },

};

var MutableClientRect = function(rect) {
    this.left = rect.left;
    this.top = rect.top;
    this.right = rect.right;
    this.bottom = rect.bottom;
    this.width = rect.width;
    this.height = rect.height;

    return this;
};

var ridi = {
    startSelectionMode: function(x, y) {

    },

    changeInitialSelection: function(x, y) {

    },

    extendUpperSelection: function(x, y) {

    },

    extendLowerSelection: function(x, y) {

    },

    getOffsetOfAnchorElement: function(anchor) {
        var el = document.getElementById(anchor);
        
        if (el) {
            var nodeIterator = document.createNodeIterator(
                el,
                NodeFilter.SHOW_TEXT,
                { acceptNode : function (node) {
                    return NodeFilter.FILTER_ACCEPT;
                }},
                true
            );

            var node = null;
            if ((node = nodeIterator.nextNode()) !== null) {
                // 첫번째 텍스트만 확인
                var r = document.createRange();
                r.selectNodeContents(node);
                var rects = r.getClientRects();
                
                if (rects.length > 0) {
                    return ridi.getPageFromElementRect(rects[0]);
                }
            }
    
            // 텍스트 노드 없는 태그 자체에 anchor가 걸려있으면
            return ridi.getPageFromElementRect(el.getBoundingClientRect());
        }

        return -1;
    },

    getPageFromElementRect: function(rect) {
        
    },

    getRangeFromSerializedRange: function(serializedRange) {
        var tmpRange = rangy.deserializeRange(serializedRange, document.body);
        
        var range = document.createRange();
        range.setStart(tmpRange.startContainer, tmpRange.startOffset);
        range.setEnd(tmpRange.endContainer, tmpRange.endOffset);
        
        tmpRange.detach();
        
        return range;
    },

    rectsOfRange: function(serializedRange) {

    },

    expandRangeByWord: function(range) {
        var startContainer = range.startContainer;
        var startOffset = range.startOffset;
        var originalOffset = startOffset;
        var containerValueLength = startContainer.nodeValue.length;

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

    removeOtherPageRects: function(rects, page) {
        var removedRects = [];
        
        for (var i = 0; i < rects.length; i++) {
            if (ridi.getPageFromElementRect(rects[i]) == page) {
                removedRects.push(rects[i]);
            }
        }

        return removedRects;
    },

    getOnlyTextNodeRects: function(range) {
        if (range.startContainer == range.endContainer)
            return range.getClientRects();
            
        var nodeIterator = document.createNodeIterator(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            { acceptNode : function (node) {
                return NodeFilter.FILTER_ACCEPT;
            }},
            true
        );

        var textNodeRects = [];
    
        var i;
        var r = document.createRange();
        r.setStart(range.startContainer, range.startOffset);
        r.setEnd(range.startContainer, range.startContainer.length);
        
        for (i = 0; i < r.getClientRects().length; i++)
            textNodeRects.push(r.getClientRects()[i]);
    
        var node = null;
        while ((node = nodeIterator.nextNode()) !== null) {
            // startContainer 노드보다 el이 앞에 있으면
            if (range.startContainer.compareDocumentPosition(node) == Node.DOCUMENT_POSITION_PRECEDING ||
                range.startContainer == node)
                continue;

            // endContainer 뒤로 넘어가면 멈춤
            if (range.endContainer.compareDocumentPosition(node) == Node.DOCUMENT_POSITION_FOLLOWING ||
                range.endContainer == node)
                break;
            
            r = document.createRange();
            r.selectNodeContents(node);

            if (ridi.isWhiteSpaceRange(r))
                continue;
        
            var rects = r.getClientRects();
    
            for (i = 0; i < rects.length; i++) {
                textNodeRects.push(rects[i]);
            }
        }
    
        r = document.createRange();
        r.setStart(range.endContainer, 0);
        r.setEnd(range.endContainer, range.endOffset);
        
        if (ridi.isWhiteSpaceRange(r) === false) {
            for (i = 0; i < r.getClientRects().length; i++)
                textNodeRects.push(r.getClientRects()[i]);
        }
    
        return textNodeRects;
    },

    isWhiteSpaceRange: function(range) {
        var rangeString = range.toString();
        return (/^\s*$/.test(rangeString));
    },

    rectsToJsonWithRelativeCoord: function(rects) {
        var result = '';
        
        for (var i = 0; i < rects.length; i++) {
            var relativeRect = ridi.rectsToRelativeCoord(rects[i]);
            
            result += relativeRect.left + ',';
            result += relativeRect.top + ',';
            result += relativeRect.width + ',';
            result += relativeRect.height + ',';
        }

        return result;
    },

    rectsToRelativeCoord: function(rect) {

    },

    getMatchedStyle : function(el, property) {
        // element property has highest priority
        var val = el.style.getPropertyValue(property);

        // if it's important, we are done
        if (el.style.getPropertyPriority(property))
            return val;

        // get matched rules
        var rules = window.getMatchedCSSRules(el);
        if (rules === null)
            return val;

        // iterate the rules backwards
        // rules are ordered by priority, highest last
        for (var i = rules.length; i --> 0;) {
            var r = rules[i];

            var important = r.style.getPropertyPriority(property);

            // if set, only reset if important
            if (val === null || important) {
                val = r.style.getPropertyValue(property);

                // done if important
                if (important)
                    break;
            }
        }
        return val;
    },

    getMatchedParentStyle : function(el, property) {
        var val = null;
        var target = el;
        while (!(val = ridi.getMatchedStyle(target, property))) {
            target = target.parentElement;
            if (target === null) {
                break;
            }
        }
        return val;
    },
};
