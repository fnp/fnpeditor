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
        metadataEditor: require('modules/metadataEditor/metadataEditor'),
        
        documentHistory: require('modules/documentHistory/documentHistory'),
        diffViewer: require('modules/diffViewer/diffViewer')
        
    };
});