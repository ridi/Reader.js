// global.ios.js

function getRectsFromSerializedRange(/*String*/serializedRange) {
    var range = getRangeFromSerializedRange(serializedRange);
    var rects = getOnlyTextNodeRectsFromRange(range);
    return rectsToAbsoluteCoord(rects);
}

var EnterBackgroundEvent = doc.createEvent('Event');
EnterBackgroundEvent.initEvent('onEnterBackground', true, true);
var EnterForegroundEvent = doc.createEvent('Event');
EnterForegroundEvent.initEvent('onEnterForeground', true, true);
