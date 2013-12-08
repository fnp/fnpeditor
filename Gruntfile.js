/* global module */

module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        requirejs: {
          compile: {
            options: {
              baseUrl: 'src/editor',
              mainConfigFile: 'src/editor/entrypoint.js',
              out: 'build/rng.js',
              name: 'entrypoint',
              include: ['libs/require']
            }
          }
        },
        less: {
            production: {
                options: {
                    paths: [''],
                    yuicompress: true
                },
                files: {
                    'build/rng.css': 'src/editor/styles/main.less'
                },
            },
        },
        jshint: {
            all: ['Gruntfile.js', 'src/**/*.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('build', ['requirejs', 'less:production']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('default', ['build']);
};