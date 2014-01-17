define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    smartxmlTransformations = require('smartxml/transformations'),
    metadataKey = 'wlxml.metadata';


var Row = function(key, value, metadata) {
    this.key = key;
    this.value  = value;
    this.metadata = metadata;
};

_.extend(Row.prototype, {
    ChangeProperty: smartxmlTransformations.createContextTransformation({
        impl: function(t, rowIndex, propName, value) {
            var row = this.getMetadata().at(rowIndex);
            t.rowIndex = rowIndex;
            t.propName = propName;
            t.oldValue = row[propName];
            row[propName] = value;
            this.triggerChangeEvent('metadataChanged', {row:row});
        },
        undo: function(t) {
            var row = this.getMetadata().at(t.rowIndex);
            row[t.propName] = t.oldValue;
            this.triggerChangeEvent('metadataChanged', {row:row});
        }
    }),

    setKey: function(key) {
        return this.metadata.node.transform(this.ChangeProperty, [this.getIndex(), 'key', key]);
    },
    getKey: function() {
        return this.key;
    },
    setValue: function(value) {
        return this.metadata.node.transform(this.ChangeProperty, [this.getIndex(), 'value', value]);
    },
    getValue: function() {
        return this.value;
    },
    remove: function() {
        this.metadata.remove(this);
    },
    getIndex: function() {
        return this.metadata.indexOf(this);
    }
});


var Metadata = function(node) {
    this._rows = [];
    Object.defineProperty(this, 'length', {
        get: function() {
            return this._rows.length;
        }
    });
    this.node = node;
};

_.extend(Metadata.prototype, {
    Add: smartxmlTransformations.createContextTransformation({
        impl: function(t, rowDesc) {
            var metadata = this.getMetadata(),
                row = new Row(rowDesc.key, rowDesc.value, metadata);
            metadata._rows.push(row);
            t.rowIdx = row.getIndex();
            this.triggerChangeEvent('metadataAdded', {row: row});
            return row;
        },
        undo: function(t) {
            this.getMetadata().at(t.rowIdx).remove();
        }
    }),

    Remove: smartxmlTransformations.createContextTransformation({
        impl: function(t, rowIdx) {
            var metadata = this.getMetadata();
            t.rowIdx = rowIdx;
            t.row = metadata.at(rowIdx);
            metadata._rows.splice(rowIdx, 1);
            this.triggerChangeEvent('metadataRemoved', {row: t.row});
        },
        undo: function(t) {
            var metadata = this.getMetadata();
            metadata._rows.splice(t.rowIdx, 0, new Row(t.row.getKey(), t.row.getValue(), metadata));
        }
    }),

    forEach: function(callback) {
        return this._rows.forEach(callback);
    },
    add: function(rowDesc, options) {
        var row;
        options = _.extend({undoable: true}, options);
        if(options.undoable) {
            return this.node.transform(this.Add, [rowDesc]);
        } else {
            row = new Row(rowDesc.key, rowDesc.value, this);
            this._rows.push(row);
            return row;
        }
    },
    at: function(idx) {
        return this._rows[idx];
    },
    indexOf: function(row) {
        var idx = this._rows.indexOf(row);
        if(idx !== -1) {
            return idx;
        }
        return undefined;
    },
    remove: function(row) {
        var idx = this.indexOf(row);
        if(typeof idx !== 'undefined') {
            this.node.transform(this.Remove, [idx]);
        }
    },
    clone: function(node) {
        var clone = new Metadata(node);
        this._rows.forEach(function(row) {
            clone._rows.push(new Row(row.getKey(), row.getValue(), clone));
        });
        return clone;
    }
});


return {
    elementNode: {
        methods: {
            getMetadata: function() {
                if(!this.getData(metadataKey)) {
                    this.setData(metadataKey, new Metadata(this));
                }
                return this.getData(metadataKey);
            }
        }
    }
};

});

