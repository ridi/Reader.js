module.exports = function(grunt) {
  var platform = grunt.option('platform');
  if (platform === undefined || (platform != 'android' && platform != 'ios')) {
    throw 'Usage: grunt [default|epub-debug|show-config] --platform=[android|ios] --dist=path';
  }

  var buildPath = 'build';
  var distPath = grunt.option('dist') || buildPath;

  require('time-grunt')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    gitinfo: {},
    variants: {
      name: 'reader',
      SHA: '<%= gitinfo.local.branch.current.SHA %>',
      banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> <%= variants.SHA %> */\n',
      strict: '\"use strict\";\n',
      platform: platform,
      basePath: 'src',
      commonPath: '<%= variants.basePath %>/common',
      platformPath: '<%= variants.basePath %>/<%= variants.platform %>',
      libsPath: '<%= variants.basePath %>/libs',
      buildPath: buildPath,
      distPath: distPath,
      src: {
        es6: [
          '<%= variants.commonPath %>/**/*.es6',
          '<%= variants.platformPath %>/*.es6'
        ],
        js: [
          '<%= variants.libsPath %>/*.js'
        ]
      },
      intermediate: '<%= variants.buildPath %>/<%= variants.name %>.js',
      dist: '<%= variants.distPath %>/<%= variants.name %>.js'
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

    jshint: {
      options: {
        strict: false,
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
      files: [
        '<%= variants.src.es6 %>'
      ]
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
        src: [
          '<%= variants.buildPath %>/<%= variants.platformPath %>/Init.js'
        ],
        dest: '<%= variants.intermediate %>',
        options: {
          browserifyOptions: {
            paths: ['js'],
            standalone: 'Reader'
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
          banner: '<%= variants.banner %><%= variants.strict %>'
        }
      }
    },

    uglify: {
      options: {
        banner: '<%= variants.banner %>',
        mangle: false
      },
      dynamic_mappings: {
        files: [{
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
        files: [{
            expand: true,
            src: '<%= variants.intermediate %>',
            dest: '<%= variants.dist %>',
            rename: function(dest) {
              return dest.replace('.js', '.min.js');
            }
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-gitinfo');
  grunt.loadNpmTasks('gruntify-eslint');

  grunt.registerTask('default', ['gitinfo', 'clean', 'lint', 'bundle', 'uglify']);
  grunt.registerTask('epub-debug', ['clean', 'lint', 'bundle', 'copy']);
  grunt.registerTask('show-config', function() { // debug
    grunt.log.writeln(JSON.stringify(grunt.config(), null, 2));
  });

  grunt.registerTask('lint', ['jshint', 'eslint']);
  grunt.registerTask('bundle', ['babel', 'browserify', 'concat']);
};
