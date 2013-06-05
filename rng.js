define({
    modules: {}, 
    initModules: ['rng'],
    permissions: {
        'skelton': ['getDOM'],
        'rng': ['getModule', 'handleEvents'],
        'rng2': ['getModule', 'handleEvents']
    }
});