define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    metadataKey = 'wlxml.metadata';


var methods = {
    getMetadata: function() {
        return this.getData(metadataKey) || [];
    }
};

var transformations = {
    addMetadataRow: function(row) {
        this.setMetadataRow(null, row);
    },

    setMetadataRow: function(index, row) {
        var metadata = this.getData(metadataKey) || [];
        if(typeof index !== 'number' || index > metadata.length - 1) {
            metadata.push(row);
            index = metadata.length - 1;
        } else {
            metadata[index] = _.extend(metadata[index], row);
        }
        this.setData(metadataKey, metadata);
        this.triggerChangeEvent('metadataChange', {index: index});
    }
};

return {
    elementNode: {
        methods: methods,
        transformations: transformations,
    }
};

});

