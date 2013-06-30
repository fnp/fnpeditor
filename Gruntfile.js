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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-less');

    grunt.registerTask('default', ['requirejs']);
};