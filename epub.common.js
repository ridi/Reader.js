// epub.common.js

var Epub = function() {};
Epub.prototype = {
    textAndImageNodes: null,
    debugTopNodeLocation: false,

    getTotalWidth: function() {
        return html.scrollWidth;
    },

    getTotalHeight: function() {
        return html.scrollHeight;
    },

    getTotalPageSize: function() {
        return app.scrollMode ? this.getTotalHeight() : this.getTotalWidth();
    },

    scrollTo: function(/*Number*/offset) {
        if (app.scrollMode) {
            scroll(0, offset);
        } else {
            scroll(offset, 0);
        }
    },

    setViewport: function() {
        mustOverride('setViewport');
    },

    getImagePathFromPoint: function(/*Number*/x, /*Number*/y) {
        var el = doc.elementFromPoint(x, y);
        return (el && el.nodeName == 'IMG') ? (el.src || 'null') : 'null';
    },

    getSvgElementFromPoint: function(/*Number*/x, /*Number*/y) {
        var el = doc.elementFromPoint(x, y);
        if (el) {
            var getSvgInnerHTML = function(/*HTMLElement*/el) {
                // svg 객체는 innerHTML 을 사용할 수 없으므로 아래와 같이 바꿔준다.
                var svgEl = doc.createElement('svgElement');
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

    getLinkFromElement: function(/*HTMLElement*/el) {
        while (el) {
            if (el && el.nodeName == 'A') {
                return {node: el, href: el.href, type: (el.attributes['epub:type'] || {value: ''}).value};
            }
            el = el.parentNode;
        }
        return null;
    },

    getOffsetDirectionFromElement: function(/*HTMLElement*/el) {
        var offsetDirection = app.scrollMode ? 'top' : 'left';
        if (el && offsetDirection == 'left' && getMatchedStyle(el, 'position', true) == 'absolute') {
            offsetDirection = 'top';
        }
        return offsetDirection;
    },

    getPageOffsetFromRect: function(/*ClientRect*/rect, /*HTMLElement*/el) {
        mustOverride('getPageOffsetFromRect');
    },

    getOffsetFromAnchor: function(/*String*/anchor, /*Function*/block) {
        var el = doc.getElementById(anchor);
        if (el) {
            var iterator = createTextNodeIterator(el), node, rect, origin;
            if ((node = iterator.nextNode()) !== null) {
                // 첫번째 텍스트만 확인
                var range = doc.createRange();
                range.selectNodeContents(node);

                var rects = range.getAdjustedClientRects();
                if (rects.length) {
                    return block(rects[0], el);
                }
            }

            // 텍스트 노드 없는 태그 자체에 anchor가 걸려있으면
            return block(el.getAdjustedBoundingClientRect(), el);
        } else {
            return block({left: -1, top: -1}, null);
        }
    },

    getPageOffsetFromAnchor: function(/*String*/anchor) {
        var that = this;
        return this.getOffsetFromAnchor(anchor, function(rect, el) {
            return that.getPageOffsetFromRect(rect, el);
        });
    },

    getScrollYOffsetFromAnchor: function(/*String*/anchor) {
        return this.getOffsetFromAnchor(anchor, function(rect) {
            return rect.top;
        });
    },

    getOffsetOfSerializedRange: function(/*String*/serializedRange, /*Function*/block) {
        try {
            var range = getRangeFromSerializedRange(serializedRange);
            var rects = range.getAdjustedClientRects();
            return block(rects.length > 0 ? rects[0] : null);
        } catch(e) {
            return block(null);
        }
    },

    getPageOffsetOfSerializedRange: function(/*String*/serializedRange) {
        return this.getOffsetOfSerializedRange(serializedRange, function(rect) {
            return this.getPageOffsetFromRect(rect);
        });
    },

    getScrollYOffsetOfSerializedRange: function(/*String*/serializedRange) {
        return this.getOffsetOfSerializedRange(serializedRange, function(rect) {
            return (rect || {top: -1}).top;
        });
    },

    // MARK: - 이미지 보정 관련

    // 제작자가 의도한 이미지 비율 또는 크기를 따르돼. 원본 비율을 붕괴시키거나 원본 크기보다 커지는 경우를 없애기 위함.
    reviseImagesInSpine: function(/*Number*/canvasWidth, /*Number*/canvasHeight) {
        mustOverride('reviseImagesInSpine');
    },

    getImageSize: function(/*HTMLElement*/imgEl, /*Number*/canvasWidth, /*Number*/canvasHeight) {
        var style = imgEl.style;
        var attrs = imgEl.attributes;

        var zeroAttr = doc.createAttribute('size');
        zeroAttr.value = '0px';

        return {
            // 화면에 맞춰 랜더링된 크기
            dWidth: imgEl.width,
            dHeight: imgEl.height,
            // 원본 크기
            nWidth: imgEl.naturalWidth,
            nHeight: imgEl.naturalHeight,
            // CSS에서 명시된 크기
            sWidth: getMatchedStyle(imgEl, 'width'),
            sHeight: getMatchedStyle(imgEl, 'height'),
            // 엘리먼트 속성으로 명시된 크기
            aWidth: (attrs.width || zeroAttr).value,
            aHeight: (attrs.height || zeroAttr).value
        };
    },

    reviseImage: function(/*HTMLElement*/imgEl, /*Number*/canvasWidth, /*Number*/canvasHeight, /*Number*/paddingTop) {
        var isPercentValue = function(/*String*/value) {
            if (typeof value == 'string') {
                return value.search(/%/);
            } else {
                return -1;
            }
        };

        var compareSize = function(/*String*/size1, /*String*/size2) {
            var intVal = parseInt(size1);
            if (!isNaN(intVal)) {
                if (isPercentValue(size1) != -1) {
                    if (intVal > 100) {
                        return 1;
                    } else if (intVal < 100) {
                        return -1;
                    }
                } else {
                    if (size2 < intVal) {
                        return 1;
                    } else if (size2 > intVal) {
                        return -1;
                    }
                }
            }
            return 0;
        };

        var calcRate = function(/*Number*/width, /*Number*/height) {
            var n, m;
            width = width || 1;
            height = height || 1;
            if (width > height) {
                n = height;
                m = width;
            } else {
                n = width;
                m = height;
            }
            return (n / m) * 100;
        };

        var size = this.getImageSize(imgEl, canvasWidth, canvasHeight);

        var cssWidth = '';
        var cssHeight = '';
        var cssMaxWidth = '';
        var cssMaxHeight = '';

        // 원본 사이즈가 없다는 것은 엑박이란 거다
        if (size.nWidth === 0 || size.nHeight === 0) {
            return null;
        }

        //
        // * 너비와 높이 크기 보정(CSS 속성과 엘리먼트 속성 그리고 원본 사이즈를 이용한)
        //   - CSS 속성 또는 엘리먼트 속성이 반영된 사이즈가 원본 사이즈보다 클 때 'initial'로 보정한다.
        //     --> width 또는 height의 값이 100% 이상일 때.
        //        (CP에서 원본 비율과 깨짐을 떠나서 단순히 여백 없이 출력하기 위해 100% 이상을 사용하더라)
        //     --> 최종 계산된 width 또는 height의 값(px)이 원본 사이즈보다 클 때.
        //   - CP에서 의도적으로 원본보다 크게 설정한 경우 난감하다.
        //

        if (compareSize(size.sWidth, size.nWidth) > 0 || compareSize(size.aWidth, size.nWidth) > 0) {
            cssWidth = 'initial';
        }
        
        if (compareSize(size.sHeight, size.nHeight) > 0 || compareSize(size.aHeight, size.nHeight) > 0) {
            cssHeight = 'initial';
        }

        //
        // * 너비와 높이 비율 보정(원본 사이즈, 랜더링된 이미지 사이즈를 이용한)
        //   - 원본 비율이 랜더링된 이미지 비율과 다를때 상황에 맞춰 보정을 한다.
        //     --> 비율은 다르나 랜더링된 이미지의 너비 또는 높이가 원본보다 작을때 근사값으로 비율을 조정해준다.
        //        다만, 근사값으로 조정한 사이즈가 화면 사이즈를 벗어나는 상황이라면 'initial'로 보정한다.
        //     --> 비율도 다르고 랜더링된 이미지의 너비 또는 높이가 원본보다 클 때 'initial'로 보정한다.
        //   - CP에서 의도적으로 비율을 깨버렸다면 매우 곤란하다.
        //

        var diff = 1, rate = 0;
        if ((size.nWidth >= size.nHeight) != (size.dWidth >= size.dHeight) ||
            abs(calcRate(size.nWidth, size.nHeight) - calcRate(size.dWidth, size.dHeight)) > diff) {
            if (size.dWidth >= size.dHeight && size.dWidth < size.nWidth) {
                rate = (calcRate(size.dWidth, size.nWidth) / 100);
                if (size.dWidth < canvasWidth && round(size.nHeight * rate) < canvasHeight) {
                    cssWidth = size.dWidth + 'px';
                    cssHeight = round(size.nHeight * rate) + 'px';
                } else {
                    cssWidth = 'initial';
                    cssHeight = 'initial';
                }
            } else if (size.dWidth < size.dHeight && size.dHeight < size.nHeight) {
                rate = (calcRate(size.dHeight, size.nHeight) / 100);
                if (round(size.nWidth * rate) < canvasWidth && size.dHeight < canvasHeight) {
                    cssWidth = round(size.nWidth * rate) + 'px';
                    cssHeight = size.dHeight + 'px';
                } else {
                    cssWidth = 'initial';
                    cssHeight = 'initial';
                }
            } else {
                cssWidth = 'initial';
                cssHeight = 'initial';
            }
        }

        //
        // * 이미지 잘림 보정(1)
        //   - 앞선 과정에서 보정된 또는 보정되지 않은 사이즈가 페이지를 벗어날 때 페이지에 맞게 보정해 준다.
        //    (높이만 보정을 하는 이유는 DOM 너비는 화면 너비에 맞게 되어있고 DOM 높이는 스크롤의 전체 길이이기 때문이다.)
        //     --> 원본 높이 또는 랜더링된 이미지의 높이가 페이지 보다 같거나 클 때 페이지에 맞게 보정한다.
        //        (단순히 페이지보다 작게 만드는게 아니라 이미지의 상단 여백을 가져와 페이지 높이에 뺀 값으로 보정한다.)
        //        (이미지의 상단 여백은 '-webkit-text-size-adjust'에 영향 받고 있으니 참고하자.)
        //

        if (!app.scrollMode) {
            var mHeight = size.dHeight;
            if (cssHeight.length) {
                mHeight = parseInt(cssHeight);
                if (isNaN(mHeight)) {
                    mHeight = size.dHeight;
                }
            }
            if (mHeight >= canvasHeight) {
                var offsetTop = (imgEl.offsetTop + paddingTop) % canvasHeight;
                if (isNaN(offsetTop)) {
                    offsetTop = 0;
                }
                if (offsetTop > 0) {
                    cssHeight = (canvasHeight * 0.95) + 'px';
                }
                paddingTop += offsetTop;
                if (cssWidth.length) {
                    cssWidth = 'initial';
                }
            }
        }

        //
        // * 이미지 잘림 보정(2)
        //   - 제작 과정에서 이 속성을 사용할 수 있기 때문에 '!important'를 붙이지는 못하고
        //    수치가 100%를 넘을때나 속성이 없을때 추가해준다. 
        //    (100%를 초과하면 사이즈에 따라 이미지가 잘리는것을 볼 수 있다)
        //    (높이를 95%로 주는 이유는 spine에 이미지 하나만 있을 때 p테그의 줄간, 서체 크기에
        //     영향을 받아 빈 페이지가 들어가기 때문이다.)
        //

        var maxWidth = getMatchedStyle(imgEl, 'max-width');
        if (isPercentValue(maxWidth) && parseInt(maxWidth) > 100) {
            cssMaxWidth = '100%';
        }

        var maxHeight = getMatchedStyle(imgEl, 'max-height');
        if (isPercentValue(maxHeight) && parseInt(maxHeight) > 95) {
            cssMaxHeight = '95%';
        }


        return {
            el : imgEl, 
            width: cssWidth, 
            height: cssHeight, 
            maxWidth: cssMaxWidth, 
            maxHeight: cssMaxHeight,
            position: '',
            paddingTop: paddingTop,
            size: size
        };
    },

    // MARK: - TopNodeLocation 관련

    // element에 붙어 있는 모든 텍스트, 이미지 노드를 구한다.
    findTextAndImageNodes: function(/*HTMLElement*/el) {
        var filter = function(/*Node*/node) {
            // 주의! topNodeLocation의 nodeIndex에 영향을 주는 부분으로 함부로 수정하지 말것.
            return node.nodeType == Node.TEXT_NODE || 
                   (node.nodeType == Node.ELEMENT_NODE && node.nodeName == 'IMG');
        };

        if (!el) {
            return [];
        }

        var calledFilter = false;
        var node, walk = doc.createTreeWalker(
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
        var nodes = [];
        while ((node = walk.nextNode())) {
            if (calledFilter) {
                nodes.push(node);
            } else if (filter(node)) {
                nodes.push(node);
            }
        }

        return nodes;
    },

    findTopNodeRectOfCurrentPage: function(/*ClientRectList*/rects, /*Number*/startOffset, /*Number*/endOffset) {
        for (var j = 0; j < rects.length; j++) {
            // rect 값이 현재 보고있는 페이지의 최상단에 위치하고 있는지.
            var origin = app.scrollMode ? rects[j].top : rects[j].left;
            if (startOffset <= origin && origin <= endOffset) {
                var rect = rects[j];
                return {top: (rect.top ? rect.top : 0),
                        bottom: (rect.bottom ? rect.bottom : 0),
                        left: (rect.left ? rect.left : 0),
                        right: (rect.right ? rect.right : 0),
                        width: rect.width,
                        height: rect.height,
                        index: j};
            }
        }
        return null;
    },

    findTopNodeRectAndLocationOfCurrentPage: function(/*NodeList*/nodes, /*Number*/startOffset, /*Number*/endOffset, /*String*/posSeparator) {
        if (!nodes) {
            return null;
        }

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var range = doc.createRange();
            range.selectNodeContents(node);

            var rect = range.getAdjustedBoundingClientRect();
            if (!rect) {
                return null;
            }

            // 노드가 현재 보고있는 페이지의 최상단에 위치하거나 걸쳐있는지.
            var origin = app.scrollMode ? (rect.top + rect.height) : (rect.left + rect.width);
            if (rect.width === 0 || origin < startOffset) {
                continue;
            }

            if (node.nodeType == Node.TEXT_NODE) {
                var string = node.nodeValue;
                if (!string) {
                    continue;
                }

                var words = string.split(WORD_REGEX);
                var offset = range.startOffset, length = string.length;
                for (var j = 0; j < words.length; j++) {
                    var word = words[j];
                    if (word.trim().length) {
                        try {
                            range.setStart(node, offset);
                            range.setEnd(node, offset + word.length);
                        } catch (e) {
                            return null;
                        }
                        if ((rect = this.findTopNodeRectOfCurrentPage(range.getAdjustedClientRects(), startOffset, endOffset)) !== null) {
                            return {rect: rect, location: (i + posSeparator + min(j + rect.index, words.length - 1))};
                        }
                    }
                    offset += (word.length + 1);
                }
            } else if (node.nodeName == 'IMG') {
                if ((rect = this.findTopNodeRectOfCurrentPage(range.getAdjustedClientRects(), startOffset, endOffset)) !== null) {
                    // 이미지 노드는 워드 인덱스를 구할 수 없기 때문에 0을 사용하며, 위치를 찾을때 이미지 노드의 rect가 현재 위치다.
                    return {rect: rect, location: (i + posSeparator + '0')};
                }
            }
        }

        return null;
    },

    showTopNodeLocation: function(/*Object*/result) {
        if (!this.debugTopNodeLocation) {
            return;
        }

        var topNode = doc.getElementById('RidiTopNode');
        if (!topNode) {
            topNode = doc.createElement('span');
            topNode.setAttribute('id', 'RidiTopNode');
            body.appendChild(topNode);
        }

        var rect = result.rect;
        if (app.scrollMode) {
            rect.top += win.pageYOffset;
        } else {
            rect.left += win.pageXOffset;
        }

        topNode.style.cssText = 
            'position: absolute !important;' +
            'background-color: red !important;' +
            'left: ' + rect.left + 'px !important;' +
            'top: ' + rect.top + 'px !important;' +
            'width: ' + (rect.width ? rect.width : 3) + 'px !important;' +
            'height: ' + rect.height + 'px !important;' +
            'display: block !important;' +
            'opacity: 0.4 !important;' +
            'z-index: 99 !important;';
    },

    getTopNodeLocationOfCurrentPage: function(/*String*/posSeparator) {
        mustOverride('getTopNodeLocationOfCurrentPage');
    },

    getPageOffsetAndRectFromTopNodeLocation: function(/*Number*/nodeIndex, /*Number*/wordIndex) {
        var pageUnit = app.getPageUnit();
        var totalPageSize = epub.getTotalPageSize();
        var notFound = {pageOffset: -1};

        var nodes = this.textAndImageNodes;
        if (pageUnit === 0 || nodeIndex == -1 || wordIndex == -1 || nodes === null || nodes.length <= nodeIndex) {
            return notFound;
        }

        var node = nodes[nodeIndex];
        if (!node) {
            return notFound;
        }

        var range = doc.createRange();
        range.selectNodeContents(node);

        var rect = range.getAdjustedBoundingClientRect();
        if (rect.isZero()) {
            return notFound;
        }

        var pageOffset = this.getPageOffsetFromRect(rect);
        if (pageOffset == -1 || totalPageSize <= pageUnit * pageOffset) {
            return notFound;
        }

        if (node.nodeName == 'IMG' && wordIndex === 0) {
            return {pageOffset: pageOffset, rect: rect};
        }

        var string = node.nodeValue;
        if (string === null) {
            return notFound;
        }

        var words = string.split(WORD_REGEX);
        if (words.length <= wordIndex) {
            wordIndex = words.length - 1;
        }

        var offset = 0, length = string.length, word = null;
        for (var i = 0; i <= wordIndex; i++) {
            word = words[i];
            offset += (word.length + 1);
        }
        try {
            range.setStart(range.startContainer, offset - word.length - 1);
            range.setEnd(range.startContainer, offset - 1);
        } catch(e) {
            return notFound;
        }

        rect = range.getAdjustedBoundingClientRect();
        pageOffset = this.getPageOffsetFromRect(rect);
        if (pageOffset == -1 || totalPageSize <= pageUnit * pageOffset) {
            return notFound;
        }

        return {pageOffset: pageOffset, rect: rect};
    },

    getPageOffsetFromTopNodeLocation: function(/*Number*/nodeIndex, /*Number*/wordIndex) {
        return this.getPageOffsetAndRectFromTopNodeLocation(nodeIndex, wordIndex).pageOffset;
    },

    getScrollYOffsetFromTopNodeLocation: function(/*Number*/nodeIndex, /*Number*/wordIndex) {
        return (this.getPageOffsetAndRectFromTopNodeLocation(nodeIndex, wordIndex).rect || {top: -1}).top;
    },

};

var RidiEpub = function() {};
RidiEpub.prototype = new Epub();
