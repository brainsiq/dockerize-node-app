'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    module: ['./*.js', './lib/**/*.js'],
    tests: ['./test/**/*.js'],
    eslint: {
      target: ['<%= module %>', '<%= tests %>']
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          clearRequireCache: false
        },
        src: ['<%= tests %>']
      }
    },
    watch: {
      all: {
        files: ['<%= module %>', '<%= tests %>'],
        tasks: ['lint', 'test']
      }
    },
    retire: {
      node: ['node']
    }
  });

  grunt.registerTask('lint', 'eslint');
  grunt.registerTask('test', 'mochaTest:test');
  grunt.registerTask('default', ['lint', 'test']);
};
