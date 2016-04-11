// init.js for common without tts

(function(){
    epub.setViewport();
    win.addEventListener(EnterBackgroundEvent.type, app.didEnterBackground);
    win.addEventListener(EnterForegroundEvent.type, app.didEnterForeground);
})();
