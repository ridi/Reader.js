// app.common.js

var App = function() {};
App.prototype = {
    pageWidthUnit: 0,
    pageHeightUnit: 0,

    // * Android
    //   ex) 14, 17, 19, ... (API level)
    // * iOS
    //   ex) 6, 7, 8, ...
    systemMajorVersion: function(/*Number*/level) {
        App.prototype.systemMajorVersion = level;
    },

    setPageSize: function(/*Number*/width, /*Number*/height) {
        this.pageWidthUnit = width;
        this.pageHeightUnit = height;
    },

    isScrollMode: function() {
        return this.pageHeightUnit != epub.getTotalHeight();
    },

    toast: function(/*String*/msg) {
        location.href = 'ridi+epub://navigation/toast?' + encodeURIComponent(msg);
    },

};

var RidiApp = function() {};
RidiApp.prototype = new App();
