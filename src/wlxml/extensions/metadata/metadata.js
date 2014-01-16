define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    metadataKey = 'wlxml.metadata';

var Row = function(key, value) {
    this.key = key;
    this.value  = value;
};
_.extend(Row.prototype, {
    setKey: function(key) {
        this.key = key;
    },
    getKey: function() {
        return this.key;
    },
    setValue: function(value) {
        this.value = value;
    },
    getValue: function() {
        return this.value;
    }
});

// var Metadata = function(node) {
//     this._rows = [];
// }

// _.extend(Metadata.prototype, {
//     forEach: function(callback) {
//         this.
//     }
// })

var methods = {
    getMetadata: function() {
        return this.getData(metadataKey) || [];
    }
};

var transformations = {
    addMetadata: function(desc) {
        var metadata = this.getData(metadataKey) || [],
            row = new Row(desc.key, desc.value);
        metadata.push(row);
        this.setData(metadataKey, metadata);
        return row;
    }
};

return {
    elementNode: {
        methods: methods,
        transformations: transformations,
    }
};

});

