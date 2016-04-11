// app.common.js

var App = function() {};
App.prototype = {
    pageWidthUnit: 0,
    pageHeightUnit: 0,

    scrollMode: false,

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
        this.scrollMode = height != epub.getTotalHeight(); // 전체 높이와 페이지 높이가 다르다면 스크롤 보기 상태
    },

    getPageUnit: function() {
        return this.scrollMode ? this.pageHeightUnit : this.pageWidthUnit;
    },

    toast: function(/*String*/msg) {
        location.href = 'ridi+epub://navigation/toast?' + encodeURIComponent(msg);
    },

};

var RidiApp = function() {};
RidiApp.prototype = new App();
