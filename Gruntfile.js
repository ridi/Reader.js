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
      distPath: distPath,
      src: {
        es6: [
          commonPath + '/**/*.es6',
          platformPath + '/*.es6'
        ],
        js: [
          libsPath + '/*.js'
        ]
      },
      intermediate: buildPath + '/<%= variants.name %>.js',
      dist: distPath + '/<%= variants.name %>.js'
    },

    clean: {
      src: [
        '<%= variants.buildPath %>',
        '<%= variants.distPath %>'
      ],
      options: {
        force: true
      }
    },

    jshint: {
      options: {
        laxbreak: true,
        globalstrict: true,
        globals: {
          'document': true
        }
      },
      files: [
        '<%= variants.src.js %>'
      ]
    },

    eslint: {
      files: ['<%= variants.src.es6 %>']
    },

    babel: {
      build: {
        options: {
          presets: ['es2015'],
          sourceMaps: false
        },
        files: [{
          expand: true,
          src: ['<%= variants.src.es6 %>'],
          dest: '<%= variants.buildPath %>',
          ext: '.js',
          extDot: 'last'
        }]
      }
    },

    browserify: {
      build: {
        files: {
          '<%= variants.intermediate %>': ['build/**/*.js']
        },
        options: {
          browserifyOptions: {
            paths: ['js'],
            standalone: '<%= variants.name %>'
          }
        }
      }
    },

    concat: {
      build: {
        src: [
          '<%= variants.intermediate %>',
          '<%= variants.src.js %>'
        ],
        dest: '<%= variants.intermediate %>',
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        }
      }
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
            src: '<%= variants.intermediate %>',
            dest: '<%= variants.dist %>',
            rename: function(dest) {
              return dest.replace('.js', '.min.js');
            }
          }
        ]
      }
    },

    copy: {
      dynamic_mappings: {
        files: [
          {
            expand: true,
            src: '<%= variants.intermediate %>',
            dest: '<%= variants.dist %>',
            rename: function(dest) {
              return dest.replace('.js', '.min.js');
            }
          }
        ]
      }
    },

    qunit: [
      'test/**/test-*.html'
    ]
  });

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('gruntify-eslint');

  grunt.registerTask('default', ['clean', 'lint', 'bundle', 'uglify']);
  grunt.registerTask('test', ['clean', 'lint', 'bundle', 'qunit']);
  grunt.registerTask('epub-debug', ['clean', 'lint', 'bundle', 'copy']); // iOS only
  grunt.registerTask('show-config', function() { // debug
    grunt.log.writeln(JSON.stringify(grunt.config(), null, 2));
  });

  grunt.registerTask('lint', ['jshint', 'eslint']);
  grunt.registerTask('bundle', ['babel', 'browserify', 'concat']);
};
