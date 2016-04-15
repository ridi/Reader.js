module.exports = function(grunt) {
  var platform = grunt.option('platform');
  if (platform === undefined || (platform != 'android' && platform != 'ios')) {
    throw 'Usage: grunt [default|test|epub-debug|show-config] --platform=[android|ios]';
  }

  var distPath = '../Reader/EPub/Javascripts';
  if (platform == 'android') {
    distPath = '../src/main/assets/javascripts';
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    variants: {
      name: 'ridi',
      banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
      platform: platform,
      basePath: 'src',
      commonPath: '<%= variants.basePath %>/common',
      platformPath: '<%= variants.basePath %>/<%= variants.platform %>',
      libsPath: '<%= variants.basePath %>/libs',
      buildPath: 'build',
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
        '<%= variants.distPath %>'
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
            standalone: 'Ridi'
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
          banner: '<%= variants.banner %>'
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
