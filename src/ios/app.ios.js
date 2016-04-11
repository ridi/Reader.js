// app.ios.js

{
    var prototype = RidiApp.prototype;

    prototype.appInBackground = false;

    prototype.toast = function(/*String*/message) {
        location.href = 'ridi+epub://navigation/toast?' + encodeURIComponent(message);
    };

    prototype.didEnterBackground = function() {
        this.appInBackground = true;
    };

    prototype.didEnterForeground = function() {
        this.appInBackground = false;
    };

}
