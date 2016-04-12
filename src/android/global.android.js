// global.android.js

function getRectsFromSerializedRange(/*Number*/idx, /*String*/serializedRange) {
    var range = getRangeFromSerializedRange(serializedRange);
    var rects = getOnlyTextNodeRectsFromRange(range);
    android.onRectsOfSerializedRange(idx, serializedRange, rectsToAbsoluteCoord(rects));
}

function adjustPoint(/*Number*/x, /*Number*/y) {
    return {x: offsetToAbsoluteForChrome(x), y: y};
}

function adjustRect(/*ClientRect*/rect) {
    return rectToRelativeForChrome(rect);
}

function adjustRects(/*ClientRectList*/rects) {
    return rectsToRelativeForChrome(rects);
}

var CURSE = 3; // Chrome 47, 49~ 대응용 매직넘버

function checkCurseInChrome() {
    var version = app.chromeMajorVersion;
    return version == 47 || version >= 49;
}

function offsetToAbsoluteForChrome(/*Number*/offset) {
    if (checkCurseInChrome() && !app.scrollMode) {
        var gap = app.getColumnGap();
        var curPage = app.getCurPage();
        var pageUnit = app.pageWidthUnit;
        var pageWeight = app.pageWeightForChrome;
        if (curPage < CURSE || app.pageOverflowForChrome) {
            offset += (pageUnit * pageWeight);
        } else {
            offset += ((pageUnit - gap) * pageWeight);
            if (pageWeight > 0 && pageWeight < CURSE) {
                offset -= (gap * (CURSE - pageWeight));
            }
        }
    }
    return offset;
}

function rectToRelativeForChromeInternal(/*ClientRect*/rect, /*Number*/gap, /*Number*/curPage) {
    rect = new MutableClientRect(rect);
    var pageUnit = app.pageWidthUnit;
    var pageWeight = app.pageWeightForChrome;
    if (curPage < CURSE || app.pageOverflowForChrome) {
        rect.left -= (pageUnit * pageWeight);
        rect.right -= (pageUnit * pageWeight);
        return rect;
    } else {
        rect.left -= ((pageUnit - gap) * pageWeight);
        rect.right -= ((pageUnit - gap) * pageWeight);
        if (pageWeight > 0 && pageWeight < CURSE) {
            rect.left += (gap * (CURSE - pageWeight));
            rect.right += (gap * (CURSE - pageWeight));
        }
        return rect;
    }
}

function rectToRelativeForChrome(/*ClientRect*/rect) {
    if (checkCurseInChrome() && !app.scrollMode) {
        return rectToRelativeForChromeInternal(rect, app.getColumnGap(), app.getCurPage());
    } else {
        return rect;
    }
}

function rectsToRelativeForChrome(/*ClientRectList*/rects) {
    if (checkCurseInChrome() && !app.scrollMode) {
        var gap = app.getColumnGap();
        var curPage = app.getCurPage();
        var newRects = [];
        for (var i = 0; i < rects.length; i++) {
            newRects.push(rectToRelativeForChromeInternal(rects[i], gap, curPage));
        }
        return newRects;
    } else {
        return rects;
    }
}

// iOS5.x, Android 4.x 버전에서 getBoundingClientRect가 null을 리턴하는 현상이 있어 직접 구현했다.
Range.prototype.getBoundingClientRect = Range.prototype.getBoundingClientRect || function() {
    var rects = this.getClientRects();
    if (rects === null) {
        return null;
    }

    var top = null, bottom = null, left = null, right = null, width = 0, height = 0;
    for (var i = 0; i < rects.length; i++) {
        var rect = rects[i];

        if (top === null) {
            top = rect.top;
        } else {
            top = min(top, rect.top);
        }

        if (bottom === null) {
            bottom = rect.bottom;
        } else {
            bottom = max(bottom, rect.bottom);
        }

        if (left === null) {
            left = rect.left;
        } else {
            left = min(left, rect.left);
        }

        if (right === null) {
            right = rect.right;
        } else {
            right = max(right, rect.right);
        }
    }

    if (left !== null && right !== null) {
        width = right - left;
        if (width < 0) {
            width = 0;
        }
    }

    if (top !== null && bottom !== null) {
        height = bottom - top;
        if (height < 0) {
            height = 0;
        }
    }

    return {top: (top ? top : 0),
            bottom: (bottom ? bottom : 0),
            left: (left ? left : 0),
            right: (right ? right : 0),
            width: width,
            height: height};
};
