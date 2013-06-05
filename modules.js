define(function(require) {
    /*
       Each module must be required explicitly by apropriate 'require' function call
       in order for requirejs optimizer to work.
    */
    return {
        data: require('modules/data'),
        rng: require('modules/rng/rng'),
        mainBar: require('modules/mainBar/mainBar'),
        indicator: require('modules/indicator/indicator'),
        
        sourceEditor: require('modules/sourceEditor'),
        visualEditor: require('modules/visualEditor'),
        
        documentCanvas: require('modules/documentCanvas/documentCanvas'),
        nodePane: require('modules/nodePane/nodePane'),
        metadataEditor: require('modules/metadataEditor/metadataEditor'),
        nodeFamilyTree: require('modules/nodeFamilyTree/nodeFamilyTree'),
        
    }
});