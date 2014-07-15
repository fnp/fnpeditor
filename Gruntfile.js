/* global module */

module.exports = function(grunt) {
    'use strict';
    var build_output_dir = grunt.option('output-dir') || 'build',
        less_files = {},
        jshint_targets = grunt.option('jshint-targets');

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
              include: ['libs/require', 'libs/ace/mode-xml'],
              generateSourceMaps: true,

              // The following two settings are required for source maps to work,
              // see: http://requirejs.org/docs/optimization.html#sourcemaps
              preserveLicenseComments: false,
              optimize: grunt.option('optimize') || 'uglify2'
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
            all: jshint_targets ? jshint_targets.split(',') : ['Gruntfile.js', 'src/**/*.js'],
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
        },
        githooks: {
            all: {
                options: {
                    dest: grunt.option('git-hooks-dir') || '.git/hooks',
                },
                'pre-commit': {
                    taskNames: ['lint'],
                    args: '--no-color',
                    template: 'pre-commit.template.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-githooks');

    grunt.registerTask('build', ['requirejs', 'less:production', 'copy:resources']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('default', ['build']);
};