module.exports = function(grunt) {
  require('time-grunt')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    gitinfo: {},
    variants: {
      name: 'reader',
      platforms: '{android,ios,web}',
      SHA: grunt.option('ci') ? '' : '<%= gitinfo.local.branch.current.SHA %> ',
      banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> <%= variants.SHA %>*/\n',
      strict: '\"use strict\";\n',
      srcPath: 'src',
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
          src: '<%= variants.intermediatePath %>/src/<%= variants.platforms %>/index.js',
          dest: '<%= variants.distPath %>',
          rename: function(dest, src) {
            return dest + '/' + '<%= variants.name %>.' + src.split('/').slice(-2, -1) + '.js';
          }
        }],
        options: {
          browserifyOptions: {
            paths: ['js'],
            standalone: 'ReaderJS',
          },
          banner: '<%= variants.banner %><%= variants.strict %>'
        }
      }
    },

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
    }
  });

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-gitinfo');
  grunt.loadNpmTasks('gruntify-eslint');

  grunt.registerTask('default', ['gitinfo', 'clean', 'lint', 'bundle']);
  grunt.registerTask('show-config', function() {
    grunt.log.writeln(JSON.stringify(grunt.config(), null, 2));
  });

  grunt.registerTask('lint', ['jshint', 'eslint']);
  grunt.registerTask('bundle', ['babel', 'browserify', 'uglify']);
};
