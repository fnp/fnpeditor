(function() {

    requirejs.config({
        baseUrl: '/static',
        
        shim: {
            'jquery-1.9.1.min': {
                exports: '$',
            },
            'underscore-min': {
                exports: '_'
            },
            'bootstrap/js/bootstrap.min': {
                deps: ['jquery-1.9.1.min']
            }
        },
        
        paths: {
            modules: '/static/editor/modules'
        }
    });

    
    var dependenciesList = [
        'jquery-1.9.1.min',
        'editor/runner',
        'editor/rng',
        
        'modules/data',
        'modules/rng',
        'modules/skelton',
        'modules/sourceEditor',
        'modules/tabsManager',
        'modules/visualEditor',
        'modules/sourceEditor',
        
        'bootstrap/js/bootstrap.min'
    ];
    
    requirejs(dependenciesList, function ($, runner, rng) {
        var args = arguments;
        
        var getModulesFromArguments = function() {
            var toret = {};
            var isModule = function(idx) {return dependenciesList[idx].substr(0, 'modules/'.length) === 'modules/';};
            var moduleName = function(idx) {return dependenciesList[idx].split('/')[1]};
            
            for(var i = 0; i < args.length; i++) {
                if(isModule(i))
                    toret[moduleName(i)] = args[i];
            }
            return toret;
        }
        
        $(function() {
            var app = new runner.Runner(rng, getModulesFromArguments());
            app.setBootstrappedData('data', RNG_BOOTSTRAP_DATA);
            app.start({rootSelector:'#editor_root'});
        });
        
    });

})();