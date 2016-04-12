module.exports = function(grunt) {
  var platform = grunt.option('platform');
  if (platform === undefined || (platform != 'android' && platform != 'ios')) {
    throw 'Usage: grunt [default|test] --platform=[android|ios]';
  }

  var targets = [];
  if (platform == 'android') {
    targets = [
      {
        path: 'main',
        src: 'epub.js'
      },
      {
        path: 'full',
        src: 'tts.js'
      }
    ];
  }

  var srcPath = 'src';
  var commonPath = 'src/common';
  var platformPath = 'src/' + platform;
  var libsPath = 'src/libs';
  var intermediatePath = 'intermediate';

  var getDestPath = function() {
    if (platform == 'android') {
      var paths = [];
      targets.forEach(function(target) {
        var path = '../src/' + target.path + '/assets/javascripts';
        paths.push(path);
        target.path = path;
      });
      return paths;
    } else {
      return '../Reader/EPub/Javascripts';
    }
  };

  var getUglifyMappingFiles = function() {
    function createFile(src, dest) {
      return {
        expand: true,
        flatten: true,
        cwd: intermediatePath,
        src: src,
        dest: dest,
        ext: '.min.js',
        extDot: 'last'
      };
    }

    if (platform == 'android') {
      var files = [];
      targets.forEach(function(target) {
        files.push(createFile(target.src, target.path));
      });
      return files;
    } else {
      return createFile('**.js', getDestPath(platform));
    }
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    variants: {
      srcPath: srcPath,
      commonPath: commonPath,
      platformPath: platformPath,
      src: [
        commonPath + '/**/*.js',
        platformPath + '/*.js',
        libsPath + '/*.js'
      ],
      dest: getDestPath(),
      uglify: {
        dynamic_mappings: {
          files: getUglifyMappingFiles()
        }
      }
    },

    clean: {
      src: [
        '<%= variants.dest %>',
        intermediatePath
      ],
      options: {
        force: true
      }
    },

    concat: {
      epub: {
        src: [
          '<%= variants.src %>',
          '!<%= variants.commonPath %>/tts/*.js',
          '!<%= variants.platformPath %>/tts*.js',
          '!<%= variants.platformPath %>/epub.init.js',
          '<%= variants.srcPath %>/epub.init.js',
          '<%= variants.platformPath %>/epub.init.js'
        ],
        dest: intermediatePath + '/epub.js',
        options: {
          banner: '\'use strict\';\n'
        }
      },
      tts: {
        src: [
          '!<%= variants.src %>',
          '<%= variants.commonPath %>/tts/*.js',
          '<%= variants.platformPath %>/tts*.js',
          '<%= variants.srcPath %>/tts.init.js'
        ],
        dest: intermediatePath + '/tts.js',
        options: {
          banner: '\'use strict\';\n'
        }
      },
      ridi: {
        src: [
          '<%= concat.epub.src %>',
          '<%= concat.tts.src %>'
        ],
        dest: intermediatePath + '/ridi.js',
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
          "HTMLElement": true,
        }
      },
      files: [
        intermediatePath + '/*.js'
      ]
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        mangle: false,
      },
      dynamic_mappings: {
        files: [
          '<%= variants.uglify.dynamic_mappings.files %>'
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
            dest: getDestPath(),
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

  grunt.registerTask('config', function() { // debug
    grunt.log.writeln(JSON.stringify(grunt.config(), null, 2));
  });
};
