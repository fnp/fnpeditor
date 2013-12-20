/* global module */

module.exports = function(grunt) {
    'use strict';

    var build_output_dir = grunt.option('output-dir') || 'build',
        less_files = {};

    less_files[build_output_dir + '/rng.css'] = 'src/editor/styles/main.less';

    grunt.initConfig({
        requirejs: {
          compile: {
            options: {
              useStrict: true,
              baseUrl: 'src/editor',
              mainConfigFile: 'src/editor/entrypoint.js',
              out: build_output_dir + '/rng.js',
              name: 'entrypoint',
              include: ['libs/require']
            }
          }
        },
        less: {
            production: {
                options: {
                    paths: [''],
                    cleancss: true,
                    relativeUrls: true,
                    rootpath: 'src/editor/styles/'
                },
                files: less_files,
            },
        },
        jshint: {
            all: ['Gruntfile.js', 'src/**/*.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        copy: {
          resources: {
            files: [
              {src: ['libs/bootstrap/img/**'], dest: build_output_dir+'/'},
            ]
          }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('build', ['requirejs', 'less:production', 'copy:resources']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('default', ['build']);
};