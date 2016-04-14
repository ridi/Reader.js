module.exports = function(grunt) {
  var platform = grunt.option('platform');
  if (platform === undefined || (platform != 'android' && platform != 'ios')) {
    throw 'Usage: grunt [default|test|epub-debug|show-config] --platform=[android|ios]';
  }

  var basePath = 'src';
  var commonPath = basePath + '/common';
  var platformPath = basePath + '/' + platform;
  var libsPath = basePath + '/libs';
  var buildPath = 'build';
  var distPath = '../Reader/EPub/Javascripts';
  if (platform == 'android') {
    distPath = '../src/main/assets/javascripts';
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    variants: {
      name: 'ridi',
      platform: platform,
      basePath: basePath,
      commonPath: commonPath,
      platformPath: platformPath,
      buildPath: buildPath,
      src: [
        commonPath + '/**/*.js',
        platformPath + '/*.js',
        libsPath + '/*.js'
      ],
      dist: distPath
    },

    clean: {
      src: [
        '<%= variants.buildPath %>',
        '<%= variants.dist %>'
      ],
      options: {
        force: true
      }
    },

    concat: {
      ridi: {
        src: [
          '<%= variants.src %>',
          '!<%= variants.commonPath %>/tts/*.js',
          '!<%= variants.platformPath %>/tts*.js',
          '!<%= variants.platformPath %>/init.js',
          '<%= variants.commonPath %>/tts/*.js',
          '<%= variants.platformPath %>/tts*.js',
          '<%= variants.basePath %>/init.js',
          '<%= variants.platformPath %>/init.js'
        ],
        dest: '<%= variants.buildPath %>/<%= variants.name %>.js',
        options: {
          banner: '\'use strict\';\n'
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
          "HTMLElement": true
        }
      },
      files: [
        '<%= variants.buildPath %>/<%= variants.name %>.js'
      ]
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        mangle: false
      },
      dynamic_mappings: {
        files: [
          {
            expand: true,
            flatten: true,
            src: '<%= concat.ridi.dest %>',
            dest: '<%= variants.dist %>',
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
            src: '<%= concat.ridi.dest %>',
            dest: '<%= variants.dist %>',
            rename: function(dest, src) {
              return dest + '/' + src.replace('.js', '.min.js');
            }
          }
        ]
      }
    },

    qunit: [
      'test/**/test-*.html'
    ]
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['clean', 'concat', 'jshint', 'uglify']);
  grunt.registerTask('test', ['clean', 'concat', 'jshint', 'qunit']);
  grunt.registerTask('epub-debug', ['clean', 'concat', 'jshint', 'copy']); // iOS only

  grunt.registerTask('show-config', function() { // debug
    grunt.log.writeln(JSON.stringify(grunt.config(), null, 2));
  });
};
