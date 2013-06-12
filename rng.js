define(function() {
    
'use strict';
    
return {
    modules: {}, 
    initModules: ['rng'],
    permissions: {
        'skelton': ['getDOM'],
        'rng': ['getModule', 'handleEvents', 'getDOM']
    }
}

});