module.exports = function(grunt) {
  var bannerText = '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n';
  var commonPath = 'common';
  var srcPath = 'src';
  var intermediatePath = 'intermediate';
  var distPath = '../Reader/EPub/Javascripts';

  var srcPaths = function(targets, options) {
    var paths = [];
    options = options || [{basePath: '', extPrefix: ''}];
    targets.forEach(function(target) {
      options.forEach(function(option) {
        paths.push(option.basePath + '/' + target + (option.extPrefix || '') + '.js');
      });
    });
    return paths;
  };

  var config = {
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      all: {
        src: [distPath],
        options: {
          force: true
        }
      }
    },
    concat: {
      epub: {
        src: [
          srcPaths(['global', 'app', 'epub', 'sel', 'handler'], [{basePath: commonPath, extPrefix: '.common'}, {basePath: srcPath, extPrefix: '.ios'}]),
          srcPaths(['searcher', 'init', 'rangy'], [{basePath: commonPath}]),
          (srcPath + '/init.js')
        ],
        dest: intermediatePath + '/epub.js',
        options: {
          banner: "'use strict';\n"
        }
      },
      tts: {
        src: [
          srcPaths(['TTSUtil', 'TTSRange', 'TTSPiece', 'TTSChunk', 'TTSUtterance', 'tts.common'], [{basePath: commonPath + '/tts'}]),
          srcPath + '/tts/tts.ios.js',
          commonPath + '/tts/init.js',
          srcPath + '/tts/init.js'
        ],
        dest: intermediatePath + '/tts.js',
        options: {
          banner: "'use strict';\n"
        }
      }
    },
    jshint: {
      options: {
        laxbreak: true,
        globalstrict: true,
        globals: {
          // TODO: must remove all globals
          "window": true,
          "navigator": true,
          "document": true,
          "location": true,
          "Node": true,
          "NodeFilter": true,
          "Range": true,
          "ClientRect": true,
          "webView": true,
          "android": true,
          "app": true,
          "epub": true,
          "sel": true,
          "handler": true,
          "searcher": true,
          "tts": true,
          "rangy": true,
          "setTimeout": true,
          "clearTimeout": true,
          "console": true,
          "alert": true,
          "scroll": true,
          "find": true,
          "getSelection": true,

          "win": true,
          "doc": true,
          "body": true,
          "floor": true,
          "min": true,
          "max": true,
          "REGEX_SPLIT_WORD": true,
          "NOT_FOUND": true,
          "init": true,
          "mustOverride": true,
          "rectsToAbsoluteCoord": true,
          "HTMLElement": true,
        }
      },
      files: [
        intermediatePath + '/*.js'
      ]
    },
    uglify: {
      options: {
        banner: bannerText,
        mangle: false,
      },
      dynamic_mappings: {
        files: [
          {
            expand: true,
            flatten: true,
            cwd: intermediatePath,
            src: '*.js',
            dest: distPath,
            ext: '.min.js',
            extDot: 'last'
          }
        ]
      }
    },
    copy: {
      dynamic_mappings: {
        files: [
          {
            expand: true,
            cwd: intermediatePath,
            src: ['*.js'],
            dest: distPath,
            rename: function(dest, src) {
              return dest + '/' + src.replace('.js', '.min.js');
            }
          }
        ]
      }
    },
    qunit: ['common/test/**/test-*.html']
  };

  grunt.initConfig(config);

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['clean:all', 'concat', 'jshint', 'uglify']);
  grunt.registerTask('no-uglify', ['clean:all', 'concat', 'jshint', 'copy']);
  grunt.registerTask('test', ['clean:all', 'jshint', 'qunit']);
};
