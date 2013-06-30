module.exports = function(grunt) {

    grunt.initConfig({
        requirejs: {
          compile: {
            options: {
              baseUrl: '',
              mainConfigFile: 'entrypoint.js',
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
                    'build/rng.css': 'styles/main.less'
                },
            },
        },
        jshint: {
            all: ['Gruntfile.js', 'modules/**/*.js', 'views/**/*.js', 'fnpjs/**/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['requirejs']);
};