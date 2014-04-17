define(function(require) {
    /*
       Each module must be required explicitly by apropriate 'require' function call
       in order for requirejs optimizer to work.
    */
    
    'use strict';
    
    return {
        data: require('modules/data/data'),
        rng: require('modules/rng/rng'),
        mainBar: require('modules/mainBar/mainBar'),
        statusBar: require('modules/statusBar/statusBar'),
        indicator: require('modules/indicator/indicator'),
        
        sourceEditor: require('modules/sourceEditor/sourceEditor'),
        
        documentCanvas: require('modules/documentCanvas/documentCanvas'),
        documentToolbar: require('modules/documentToolbar/documentToolbar'),
        nodePane: require('modules/nodePane/nodePane'),
        metadataEditor: require('modules/metadataEditor/metadataEditor'),
        nodeFamilyTree: require('modules/nodeFamilyTree/nodeFamilyTree'),
        nodeBreadCrumbs: require('modules/nodeBreadCrumbs/nodeBreadCrumbs'),
        
        documentHistory: require('modules/documentHistory/documentHistory'),
        diffViewer: require('modules/diffViewer/diffViewer')
        
    };
});