// epub.init.js

(function(){
    epub.setViewport();
    win.addEventListener(EnterBackgroundEvent.type, app.didEnterBackground);
    win.addEventListener(EnterForegroundEvent.type, app.didEnterForeground);
})();
