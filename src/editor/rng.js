define(function() {
    
'use strict';
    
return {
    modules: {},
    initModules: ['rng'],
    permissions: {
        'rng': ['getModule', 'handleEvents', 'getDOM']
    }
};

});