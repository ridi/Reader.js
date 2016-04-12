// epub.android.js

{
    var prototype = RidiEpub.prototype;

    // 이 값이 true면 두쪽 보기에서 오른쪽 면에 보여지는 페이지는 .5로 계산해준다
    prototype.calcPageForDoublePageMode = false;

    prototype.scrollTimer = null;

    prototype.scrollTo = function(/*Number*/offset, /*Boolean*/animated, /*Boolean*/finalPageInSpine) {
        if (app.scrollMode) {
            // 네이티브의 getContentHeight 값을 신뢰할 수 없어서 paddingBottom에 대한 보정은 여기서 한다
            var height = app.pageHeightUnit;
            var paddingBottom = getStylePropertyIntValue(body, 'padding-bottom');
            var maxOffset = this.getTotalHeight() - height - paddingBottom;
            if (finalPageInSpine) {
                offset = maxOffset;
            }
            offset = min(offset, maxOffset);
        }
        if (animated) {
            if (this.scrollTimer) {
                clearTimeout(this.scrollTimer);
                this.scrollTimer = null;
            }

            var start = app.scrollMode ? win.pageYOffset : win.pageXOffset;
            var change = offset - start;
            var increment = 20;
            var duration = 200;

            var easeInOut = function(/*Number*/currentTime, /*Number*/start, /*Number*/change) {
                currentTime /= duration / 2;
                if (currentTime < 1) {
                    return change / 2 * currentTime * currentTime + start;
                }
                currentTime--;
                return -change / 2 * (currentTime * (currentTime - 2) - 1) + start;
            };

            var that = this;
            var animateScroll = function(/*Number*/elapsedTime) {        
                elapsedTime += increment;
                Epub.prototype.scrollTo.call(that, easeInOut(elapsedTime, start, change));
                if (elapsedTime < duration) {
                    that.scrollTimer = setTimeout(function() {
                        animateScroll(elapsedTime);
                    }, increment);
                } else {
                    that.scrollTimer = null;
                }
            };

            animateScroll(0);
        } else {
            Epub.prototype.scrollTo.call(this, offset);
        }
    };

    prototype.setViewport = function(/*Number*/scale) {
        var viewport = doc.querySelector('meta[name=viewport]');
        if (viewport === null) {
            viewport = doc.createElement('meta');
            viewport.id = 'viewport';
            viewport.name = 'viewport';
            doc.getElementsByTagName('head')[0].appendChild(viewport);
        }
        viewport.content = 'initial-scale=' + scale;
    };

    prototype.getPageOffsetFromRect = function(/*ClientRect*/rect, /*HTMLElement*/el) {
        if (rect === null) {
            return NOT_FOUND;
        }

        var offsetDirection = this.getOffsetDirectionFromElement(el);
        var elOrigin = rect[offsetDirection];
        if (app.scrollMode) {
            elOrigin += win.pageYOffset;
        } else {
            elOrigin += win.pageXOffset;
        }

        var pageUnit = offsetDirection == 'left' ? app.pageWidthUnit : app.pageHeightUnit;
        var offset = elOrigin / pageUnit;
        var fOffset = floor(offset);
        if (app.calcPageForDoublePageMode) {
            var rOffset = round(offset);
            if (fOffset == rOffset) {
                return fOffset;
            } else {
                return rOffset - 0.5;
            }
        } else {
            return fOffset;
        }
    };

    prototype.reviseImagesInSpine = function(/*Number*/canvasWidth, /*Number*/canvasHeight) {
        var results = [];
        var paddingTop = 0;
        var that = this;
        [].forEach.call(doc.images, function(imgEl) {
            var result = that.reviseImage(imgEl, canvasWidth, canvasHeight, paddingTop);
            if (result.width.length || result.height.length || result.maxWidth.length || result.maxHeight.length || result.position.length) {
                paddingTop += result.paddingTop;
                results.push({
                    el: imgEl, 
                    width: result.width, 
                    height: result.height, 
                    maxWidth: result.maxWidth, 
                    maxHeight: result.maxHeight, 
                    position: result.position
                });
            }
        });

        [].forEach.call(results, function(result) {
            var el = result.el;
            if (result.width.length) {
                el.style.width = result.width;
            }
            if (result.height.length) {
                el.style.height = result.height;
            }
            if (result.maxWidth.length) {
                el.style.maxWidth = result.maxWidth;
            }
            if (result.maxHeight.length) {
                el.style.maxHeight = result.maxHeight;
            }
            if (result.position.length) {
                el.style.position = result.position;
            }
        });
    };

    prototype.reviseImage = function(/*HTMLElement*/imgEl, /*Number*/canvasWidth, /*Number*/canvasHeight, /*Number*/paddingTop) {
        var result = Epub.prototype.reviseImage.call(this, imgEl, canvasWidth, canvasHeight, paddingTop);
        var size = result.size;

        //
        // * Chrome 39 관련 보정
        //   - CSS로 지정된 이미지의 크기가 화면 크기보다 크면 화면 너비에 맞춰 비율을 유지하며 이미지 크기를 조절해 주는데
        //     39 이상부터 비율을 유지해주지 않고 너비만 화면에 맞춰주는 현상이 있어 이미지 보정에 오작동을 야기시키고 있다
        //     그래서 모든 스타일이 반영된 이미지 크기가 화면 크기보다 크면 랜더링된 이미지 크기를 화면 크기로 바꿔서
        //     오작동이 일어나지 않도록 우회시켜주고 있다
        //

        if (app.chromeMajorVersion >= 39) {
            var _sWidth = getStylePropertyIntValue(imgEl, 'width');
            var _sHeight = getStylePropertyIntValue(imgEl, 'height');
            var boundWidth = canvasWidth, boundHeight = canvasHeight;
            if (_sWidth > boundWidth || _sHeight > boundHeight) {
                // img 태그에 들어간 lineHeight을 없애줘야 스파인 하나에 이미지 하나 있는 아이가 두 페이지로 계산되는 일을 피할 수 있다
                boundHeight -= getStylePropertyIntValue(imgEl, 'line-height');
                if (_sWidth > boundWidth) {
                    size.dWidth = boundWidth;
                    size.dHeight = min(boundWidth / size.nWidth * size.nHeight, boundHeight);
                } else {
                    size.dWidth = min(boundHeight / size.nHeight * size.nWidth, boundWidth);
                    size.dHeight = boundHeight;
                }
                result.width = size.dWidth + 'px';
                result.height = size.dHeight + 'px';
            }
        }

        //
        // * 부모에 의한 크기 소멸 보정.
        //   - Android 2.x~4.x에서 이미지 태그의 부모 중 h1~h5 태그가 있을 때
        //    너비 또는 높이가 0으로 랜더링되는 현상을 방지한다.
        //    (해당 증상이 발생하는 bookId=852000033, 커버 이미지)
        //

        if (size.dWidth === 0 || size.dHeight === 0) {
            var element = imgEl.parentElement;
            do {
                var nodeName = element.nodeName;
                if (nodeName.match(/H[0-9]/)) {
                    result.position = 'absolute';
                    break;
                }
            } while ((element = element.parentElement));
        }

        return result;
    };

    prototype.getScrollYOffsetFromAnchor = function(/*String*/anchor) {
        var scrollYOffset = Epub.prototype.getScrollYOffsetFromAnchor.call(this, anchor);
        if (scrollYOffset !== NOT_FOUND) {
            scrollYOffset += win.pageYOffset;
        }
        return scrollYOffset;
    };

    prototype.getScrollYOffsetFromSerializedRange = function(/*String*/serializedRange) {
        var scrollYOffset = Epub.prototype.getScrollYOffsetFromSerializedRange.call(this, serializedRange);
        if (scrollYOffset !== NOT_FOUND) {
            scrollYOffset += win.pageYOffset;
        }
        return scrollYOffset;
    };

    prototype.getTopNodeLocationOfCurrentPage = function(/*String*/posSeparator) {
        var startOffset = 0;
        var endOffset = app.getPageUnit();

        if (startOffset == endOffset) {
            android.onTopNodeLocationOfCurrentPageNotFound();
            return;
        }

        if (!this.textAndImageNodes) {
            this.textAndImageNodes = this.findTextAndImageNodes(body);
            android.onTopNodeLocationOfCurrentPageNotFound();
            return;
        }

        var result = this.findTopNodeRectAndLocationOfCurrentPage(this.textAndImageNodes, startOffset, endOffset, posSeparator);
        if (!result) {
            android.onTopNodeLocationOfCurrentPageNotFound();
            return;
        }

        this.showTopNodeLocation(result);

        android.onTopNodeLocationOfCurrentPageFound(result.location);
    };

    prototype.getScrollYOffsetFromTopNodeLocation = function(/*Number*/nodeIndex, /*Number*/wordIndex) {
        var scrollYOffset = Epub.prototype.getScrollYOffsetFromTopNodeLocation.call(this, nodeIndex, wordIndex);
        if (scrollYOffset !== NOT_FOUND) {
            scrollYOffset += win.pageYOffset;
        }
        return scrollYOffset;
    };

    prototype.applyColumnProperty = function(/*Number*/width, /*Number*/gap) {
        html.setAttribute('style', 
            '-webkit-column-width: ' + width  + 'px !important; ' +
            '-webkit-column-gap: ' + gap + 'px !important;');
        var style = (body.attributes.style || {nodeValue: ''}).nodeValue;
        var originStyle = style;
        style += 'margin-top: -1px !important;';
        body.setAttribute('style', style);
        setTimeout(function() {
            body.setAttribute('style', originStyle);
        }, 0);
    };

    prototype.calcPageCount = function(/*Number*/columnWidth, /*Boolean*/doublePageMode) {
        if (app.scrollMode) {
            return round(this.getTotalHeight() / app.pageHeightUnit);
        }

        var totalWidth = this.getTotalWidth();
        if (totalWidth < columnWidth) {
            // 가끔 total width가 0으로 넘어오는 경우가 있다. (커버 페이지에서 이미지가 그려지기 전에 호출된다거나)
            // 젤리빈에서는 0이 아닌 getWidth()보다 작은 값이 나오는 경우가 확인되었으며 재요청시 정상값 들어옴.
            // (-1을 리턴하면 재요청을 진행하게됨)
            return -1;
        }

        var version = app.chromeMajorVersion;
        if (version < 48 && version >= 45) {
            // Chrome 45 버전부터 epub.totalWidth() 값을 신뢰할 수 없게 되었다
            var bodyComputedStyle = win.getComputedStyle(body);
            var bodyHeight = parseFloat(bodyComputedStyle.height);
            var pageCount = bodyHeight / app.pageHeightUnit;
            if (doublePageMode) {
                pageCount /= 2;
            }
            return ceil(pageCount);
        } else {
            return ceil(totalWidth / app.pageWidthUnit);
        }
    };

}
