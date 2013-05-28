(function() {

    requirejs.config({
        baseUrl: '/static/editor',
        
        shim: {
            'libs/jquery-1.9.1.min': {
                exports: '$',
            },
            'libs/underscore-min': {
                exports: '_'
            },
            'libs/bootstrap/js/bootstrap.min': {
                deps: ['libs/jquery-1.9.1.min']
            }
        }

    });
    
    requirejs([
        'libs/jquery-1.9.1.min',
        'runner',
        'rng',
        './modules',
        'libs/bootstrap/js/bootstrap.min'
    ], function($, runner, rng, modules) {
        $(function() {
            var app = new runner.Runner(rng, modules);
            app.setBootstrappedData('data', RNG_BOOTSTRAP_DATA);
            app.start({rootSelector:'#editor_root'});
        });
    });


})();