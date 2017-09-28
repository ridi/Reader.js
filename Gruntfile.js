module.exports = function(grunt) {
  require('time-grunt')(grunt);

  var platforms = 'android,ios,web';

  function libconcat(options) {
    var object = {};
    platforms.split(',').forEach(function(platform) {
      object[platform] = {
        src: [
          options.src + '/*' + platform + '.js',
          '<%= variants.libPath %>/*.js'
        ],
        dest: options.dest + '/<%= variants.name %>.' + platform + '.js',
        options: {
          banner: '<%= variants.banner %><%= variants.strict %>'
        }
      };
    });
    return object;
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    variants: {
      name: 'reader',
      banner: '/*! <%= pkg.name %> v<%= pkg.version %> */\n',
      strict: '\"use strict\";\n',
      srcPath: 'src',
      libPath: '<%= variants.srcPath %>/libs',
      buildPath: 'build',
      intermediatePath: '<%= variants.buildPath %>',
      distPath: 'dist'
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
        '<%= variants.srcPath %>/**/*.js'
      ]
    },

    eslint: {
      files: [
        '<%= variants.srcPath %>/**/*.es6'
      ]
    },

    babel: {
      build: {
        files: [{
          expand: true,
          src: '<%= variants.srcPath %>/**/*.{js,es6}',
          dest: '<%= variants.intermediatePath %>',
          ext: '.js',
          extDot: 'last'
        }],
        options: {
          presets: ['es2015'],
          sourceMaps: false
        }
      }
    },

    browserify: {
      build: {
        files: [{
          expand: true,
          src: '<%= variants.intermediatePath %>/src/{' + platforms + '}/index.js',
          dest: '<%= variants.distPath %>',
          rename: function(dest, src) {
            return dest + '/' + '<%= variants.name %>.' + src.split('/').slice(-2, -1) + '.js';
          }
        }],
        options: {
          browserifyOptions: {
            paths: ['js'],
            standalone: 'ReaderJS',
          }
        }
      }
    },

    concat: libconcat({
      src: '<%= variants.distPath %>',
      dest: '<%= variants.distPath %>'
    }),

    uglify: {
      build: {
        files: [{
          expand: true,
          src: '<%= variants.distPath %>/*.js',
          dest: '<%= variants.distPath %>',
          rename: function(dest, src) {
            return src.replace('.js', '.min.js');
          }
        }],
        options: {
          banner: '<%= variants.banner %>',
          mangle: false
        }
      }
    },

    watch: {
      scripts: {
        files: ['<%= variants.srcPath %>/**/*.{js,es6}'],
        tasks: ['default'],
        options: {
          spawn: false
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('gruntify-eslint');

  grunt.registerTask('default', ['clean', 'lint', 'bundle']);
  grunt.registerTask('lint', ['jshint', 'eslint']);
  grunt.registerTask('bundle', ['babel', 'browserify', 'concat', 'uglify']);
  grunt.registerTask('show-config', function() {
    grunt.log.writeln(JSON.stringify(grunt.config(), null, 2));
  });
};
