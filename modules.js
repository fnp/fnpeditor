define(function(require) {
    /*
       Each module must be required explicitly by apropriate 'require' function call
       in order for requirejs optimizer to work.
    */
    return {
        data: require('modules/data'),
        rng: require('modules/rng'),
        skelton: require('modules/skelton'),
        sourceEditor: require('modules/sourceEditor'),
        tabsManager: require('modules/tabsManager'),
        visualEditor: require('modules/visualEditor'),
    }
});