// app.android.js

{
    var prototype = RidiApp.prototype;

    prototype.chromeMajorVersion = null;

    prototype.systemMajorVersion = function(/*Number*/level) {
        var chrome = ((navigator.userAgent || '').match(/chrome\/[\d]+/gi) || [''])[0];
        var version = parseInt((chrome.match(/[\d]+/g) || [''])[0]);
        if (!isNaN(version)) {
            this.chromeMajorVersion = version;
        }
        App.prototype.systemMajorVersion.call(this, level);
    };

    prototype.setPageSize = function(/*Number*/width, /*Number*/height, /*Number*/pageInSpine) {
        App.prototype.setPageSize.call(this, width, height);
        if (checkCurseInChrome() && !app.scrollMode) {
            pageInSpine |= 0;
            this.pageWeightForChrome = min(pageInSpine, CURSE);
            this.prevPage = pageInSpine;
            this.setScrollListener();
        }
    };

    RidiApp.TOAST_LENGTH_SHORT = 0;
    RidiApp.TOAST_LENGTH_LONG = 1;

    prototype.toast = function(/*String*/msg, /*ConstNumber*/lengthType) {
        android.onShowToast(msg, lengthType || RidiApp.TOAST_LENGTH_SHORT);
    };

    prototype.moveTo = function() {
        var args = arguments;
        var thisArg = args[0];
        var target = args[1];
        if (app.scrollMode) {
            var scrollYOffset = thisArg['getScrollYOffsetFrom' + target](args[2], args[3]);
            if (scrollYOffset !== NOT_FOUND) {
                android['onScrollYOffsetOf' + target + 'Found'](android.dipToPixel(scrollYOffset));
                return;
            }
        } else {
            var pageOffset = thisArg['getPageOffsetFrom' + target](args[2], args[3]);
            if (pageOffset !== NOT_FOUND) {
                android['onPageOffsetOf' + target + 'Found'](pageOffset);
                return;
            }
        }
        var notFound = android['on' + target + 'NotFound'];
        if (notFound) {
            notFound();
        }
    };

    prototype.moveToAnchor = function(/*String*/anchor) {
        this.moveTo(epub, 'Anchor', anchor);
    };

    prototype.moveToSerializedRange = function(/*String*/range) {
        this.moveTo(epub, 'SerializedRange', range);
    };

    prototype.moveToTopNodeLocation = function(/*Number*/nodeIndex, /*Number*/wordIndex) {
        this.moveTo(epub, 'TopNodeLocation', nodeIndex, wordIndex);
    };

    prototype.moveToChunkId = function(/*Number*/chunkId) {
        this.moveTo(tts, 'ChunkId', chunkId);
    };

    // MARK: - Chrome 47 대응 관련

    prototype.prevPage = 0;
    prototype.pageWeightForChrome = CURSE;
    prototype.pageOverflowForChrome = false;

    prototype.getColumnGap = function() {
        return getStylePropertyIntValue(html, '-webkit-column-gap');
    };

    prototype.getCurPage = function() {
        if (app.scrollMode) {
            return win.pageYOffset / this.pageHeightUnit;
        } else {
            return win.pageXOffset / this.pageWidthUnit;
        }
    };

    prototype.setScrollListener = function() {
        win.addEventListener('scroll', function() {
            if (checkCurseInChrome()) {
                // * Chrome 47, 49 대응
                // 현재 페이지를 기준으로 rect를 구할 때 left의 기준이 변경됨에 따라 아래와 같이 대응함 (rectToRelativeForChrome)
                // 1) 다음 페이지 이동만 할 때
                //   1-1) 현재 페이지가 1~3 페이지일 때는 left에 pageUnit * pageWeight만큼 뻬야 한다
                //   1-2) 4 페이지 이상일 때는 pageGap을 제외한 pageUnit에 3(pageWeight의 최대치)을 곱한만큼 뻬야 한다
                // 2) 다음 페이지 이동만 하다가 이전 페이지로 이동할 때
                //   2-1) 이전 페이지 이동을 하기 전 페이지를 기준으로 3회 미만 이동할 때
                //      2-1-1) pageGap에 이동한 페이지 수(3 - pageWeight)를 곱한만큼 더해야 한다
                //   2-2) 3회 이상 이동할 때 (pageOverflowForChrome = true)
                //      2-2-1) pageUnit * pageWeight만큼 뻬야 한다
                //   2-3) pageOverflowForChrome가 true가 되면 pageWeight가 3이 되기 전까지 2-2를 사용한다
                // 현재 페이지에 대한 터치 포인트 기준도 변경됨에 따라 아래와 같이 대응함 (offsetToAbsoluteForChrome)
                // 1) left에 대한 대응에서 '빼기'를 '더하기'로 '더하기'를 '빼기'로 바꾼게 터치에 대한 대응
                var curPage = app.getCurPage();
                var prevPage = app.prevPage;
                var pageWeight = app.pageWeightForChrome;
                var gap = app.getColumnGap();
                if (curPage > prevPage) {
                    pageWeight = min(pageWeight + (curPage - prevPage), CURSE);
                    if (app.pageOverflowForChrome) {
                        app.pageOverflowForChrome = pageWeight < CURSE;
                    }
                } else if (curPage < prevPage) {
                    pageWeight = max(pageWeight - (prevPage - curPage), 0);
                    if (app.pageOverflowForChrome) {
                        app.pageOverflowForChrome = pageWeight < CURSE;
                    } else {
                        // 3 페이지 이상 이전 페이지 이동했을 때
                        app.pageOverflowForChrome = pageWeight === 0;
                    }
                }
                app.prevPage = curPage;
                app.pageWeightForChrome = pageWeight;
            }
        });
    };

}
