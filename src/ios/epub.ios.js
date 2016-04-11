// epub.ios.js

{
    var prototype = RidiEpub.prototype;

    prototype.setViewport = function() {
        var viewport = doc.querySelector('meta[name=viewport]');
        var value = 'width=' + win.innerWidth + ', height=' + win.innerHeight + ', initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=0';
        if (viewport === null) {
            viewport = doc.createElement('meta');
            viewport.id = 'viewport';
            viewport.name = 'viewport';
            doc.getElementsByTagName('head')[0].appendChild(viewport);
        }
        viewport.content = value;
    };

    prototype.getPageOffsetFromRect = function(/*ClientRect*/rect, /*{HTMLElement}*/el) {
        if (rect === null) {
            return NOT_FOUND;
        }
        var offsetDirection = this.getOffsetDirectionFromElement(el);
        var origin = rect[offsetDirection];
        return floor(origin / (app.scrollMode ? app.pageHeightUnit : app.pageWidthUnit));
    };

    prototype.reviseImagesInSpine = function() {
        var that = this;
        var paddingTop = 0;
        var tryReviseImages = function() {
            if (els.length != imgEls.length) {
                return;
            } else {
                var results = [];
                imgEls.forEach(function(imgEl) {
                    var result = that.reviseImage(imgEl, app.pageWidthUnit, app.pageHeightUnit, paddingTop);
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

                //
                // * 보정된 스타일 반영.
                //
                results.forEach(function(result) {
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
                that.didFinishReviseImages = true;
            }
        };

        this.didFinishReviseImages = false;

        var imgEls = [];
        var els = doc.getElementsByTagName('img');
        [].forEach.call(els, function(el) {
            if (el.complete) {
                imgEls.push(el);
            } else {
                if (app.systemMajorVersion >= 8) {
                    el.setAttribute('src', el.getAttribute('src') + '?stamp=' + Math.random());
                }
                el.addEventListener('load', function() {// 이미지 로드 완료
                    imgEls.push(el);
                    tryReviseImages();
                });
                el.addEventListener('error', function() {// 이미지 로드 실패
                    imgEls.push(null);
                    tryReviseImages();
                });
            }
        });

        tryReviseImages();
    };

    prototype.getTopNodeLocationOfCurrentPage = function(/*String*/posSeparator) {
        var pageUnit = app.getPageUnit();
        var startOffset;
        var endOffset;
        if (app.systemMajorVersion >= 8) {
            startOffset = 0;
            endOffset = pageUnit;
        } else {
            startOffset = app.scrollMode ? win.pageYOffset : win.pageXOffset;
            endOffset = startOffset + pageUnit;
        }

        var notFound = '-1' + posSeparator + '-1';

        // 앱이 백그라운드 상태일 때는 계산하지 않는다.
        // (백그라운드 상태에서는 scrollLeft 값을 신뢰할 수 없기 때문)
        if (app.appInBackground) {
            return notFound;
        }

        if (startOffset == endOffset) {
            return notFound;
        }

        if (!this.textAndImageNodes) {
            this.textAndImageNodes = this.findTextAndImageNodes(body);
            return notFound;
        }

        var result = this.findTopNodeRectAndLocationOfCurrentPage(this.textAndImageNodes, startOffset, endOffset, posSeparator);
        if (!result) {
            return notFound;
        }

        this.showTopNodeLocation(result);

        return result.location;
    };

    prototype.getScrollYOffsetFromTopNodeLocation = function(/*Number*/nodeIndex, /*Number*/wordIndex) {
        var scrollYOffset = Epub.prototype.getScrollYOffsetFromTopNodeLocation.call(this, nodeIndex, wordIndex);
        if (scrollYOffset !== NOT_FOUND && app.systemMajorVersion >= 8) {
            scrollYOffset += win.pageYOffset;
        }
        return scrollYOffset;
    };
}
