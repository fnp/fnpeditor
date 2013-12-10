(function() {
    'use strict';
    
    /* globals requirejs, editor_init */

    requirejs.config({
        baseUrl: '/static/editor/src/editor',
        
        paths: {
            'fnpjs': '../fnpjs',
            'libs': '../../libs',
            'smartxml': '../smartxml',
            'wlxml': '../wlxml',

        },

        map: {
            '*':
                {
                    'libs/jquery': '../../libs/jquery-1.9.1.min',
                    'libs/underscore': '../../libs/underscore-min',
                    'libs/bootstrap': '../../libs/bootstrap/js/bootstrap.min',
                    'libs/backbone': '../../libs/backbone-min',

                }
        },

        shim: {
            '../../libs/jquery-1.9.1.min': {
                exports: '$',
            },
            '../../libs/underscore-min': {
                exports: '_'
            },
            '../../libs/bootstrap/js/bootstrap.min': {
                deps: ['libs/jquery']
            },
            '../../libs/backbone-min': {
                exports: 'Backbone',
                deps: ['libs/jquery', 'libs/underscore']
            }
        }

    });
    
    requirejs([
        'libs/jquery',
        '../fnpjs/runner',
        'rng',
        './modules',
        'plugins/core/core',
        'libs/bootstrap'
    ], function($, runner, rng, modules, corePlugin) {
        $(function() {
            var app = new runner.Runner(rng, modules);
            app.registerPlugin(corePlugin);

            if(typeof editor_init !== 'undefined') {
                editor_init(app);
            }
        });
    });


})();