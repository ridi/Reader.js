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
        commonPath + '/**/*.es6',
        platformPath + '/*.es6',
        libsPath + '/*.es6'
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
          '!<%= variants.commonPath %>/tts/*.es6',
          '!<%= variants.platformPath %>/tts*.es6',
          '!<%= variants.platformPath %>/init.es6',
          '<%= variants.commonPath %>/tts/*.es6',
          '<%= variants.platformPath %>/tts*.es6',
          '<%= variants.basePath %>/init.es6',
          '<%= variants.platformPath %>/init.es6'
        ],
        dest: '<%= variants.buildPath %>/<%= variants.name %>.es6'
      }
    },

    eslint: {
      files: ['<%= concat.ridi.dest %>']
    },

    babel: {
      ridi: {
        options: {
          presets: ['es2015'],
          sourceMaps: false
        },
        files: [{
          expand: true,
          src: ['<%= concat.ridi.dest %>'],
          dest: '',
          ext: '.js',
          extDot: 'last'
        }]
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
            src: '<%= variants.buildPath %>/<%= variants.name %>.js',
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
            src: '<%= variants.buildPath %>/<%= variants.name %>.js',
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

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('gruntify-eslint');

  grunt.registerTask('default', ['clean', 'concat', 'eslint', 'babel', 'uglify']);
  grunt.registerTask('test', ['clean', 'concat', 'eslint', 'babel', 'qunit']);
  grunt.registerTask('epub-debug', ['clean','concat', 'eslint', 'babel', 'copy']); // iOS only

  grunt.registerTask('show-config', function() { // debug
    grunt.log.writeln(JSON.stringify(grunt.config(), null, 2));
  });
};
