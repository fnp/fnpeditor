define({
    modules: {}, 
    initModules: ['rng'],
    permissions: {
        'skelton': ['getDOM'],
        'rng': ['getModule', 'handleEvents', 'getDOM'],
        'rng2': ['getModule', 'handleEvents']
    }
});