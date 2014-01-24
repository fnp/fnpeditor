define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    toret = {};


var getTransDesc = function(desc) {
    if(typeof desc === 'function') {
        desc = {impl: desc};
    }
    if(!desc.impl) {
        throw new Error('Got transformation description without implementation.');
    }
    return desc;
};

toret.createGenericTransformation = function(desc, name) {
    desc = getTransDesc(desc);
    
    var GenericTransformation = function(document, args) {
        this.args = args || [];
        var transformation = this;
        
        var patchObject = function(obj, depth) {
            depth = _.isNumber(depth) ? depth : 1;
            if(depth > 3) {
                return;
            }
            _.keys(obj).forEach(function(key) {
                var value = obj[key];
                if(value) {
                    if(value.nodeType) {
                        transformation.wrapNodeProperty(obj, key);
                    } else if(_.isObject(value)) {
                        patchObject(value, depth+1);
                    }
                }
            });
        };

        this.args.forEach(function(arg, idx, args) {
            if(arg) {
                if(arg.nodeType) { // ~
                    transformation.wrapNodeProperty(args, idx);
                } else if(_.isObject(arg)) {
                    patchObject(arg);
                }
            }
        });

        this.document = document;
        this.hasRun = false;
        if(desc.init) {
            desc.init.call(this);
        }
    };
    _.extend(GenericTransformation.prototype, {
        name: name,
        run: function(options) {
            var changeRoot;
            if(!desc.undo && options.beUndoable) {
                changeRoot = this.getChangeRoot();
                if(!changeRoot) {
                     throw new Error(
                         'Transformation {name} returned invalid change root value'
                         .replace('{name}', name)
                     );
                }
                this.changeRootPath = changeRoot.getPath();
                this.snapshot = changeRoot.clone();
            }
            var argsToPass = desc.undo ? [this].concat(this.args) : this.args;
            var toret = desc.impl.apply(this.context, argsToPass);
            this.hasRun = true;
            return toret;
        },
        undo: function() {
            if(desc.undo) {
                desc.undo.call(this.context, this);
            } else {
                this.document.getNodeByPath(this.changeRootPath).replaceWith(this.snapshot);
            }
        },
        getChangeRoot: desc.getChangeRoot || function() {
            return this.document.root;
        },
        wrapNodeProperty: function(object, propName, value) {
            var transformation = this,
                path;
            
            value = value || object[propName];
            if(value && value.nodeType) {
                path = value.getPath();
                Object.defineProperty(object, propName, {
                    get: function() {
                        if(transformation.hasRun && path) {
                            return transformation.document.getNodeByPath(path);
                        } else {
                            return value;
                        }
                    }
                });
            }
        }
    });

    return GenericTransformation;
};

toret.createContextTransformation = function(desc, name) {
    var GenericTransformation = toret.createGenericTransformation(desc, name);

    var ContextTransformation = function(document, object, args) {
        GenericTransformation.call(this, document, args);

        if(document === object) {
            this.context = document;
        } else {
            this.wrapNodeProperty(this, 'context', object);
        }
    };
    ContextTransformation.prototype = Object.create(GenericTransformation.prototype);
    return ContextTransformation;
};

return toret;

});