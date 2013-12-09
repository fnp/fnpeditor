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
        // _.keys(this.args).forEach(function(key) {
        //     if(transformation.args[key].nodeType) { //@@ change to instanceof check, fix circular dependency
        //         var value = transformation.args[key],
        //             path = value.getPath();
        //         Object.defineProperty(transformation.args, key, {
        //             get: function() {
        //                 if(transformation.hasRun) {
        //                     //console.log('returning via path');
        //                     return transformation.document.getNodeByPath(path);
        //                 } else {
        //                     //console.log('returning original arg');
        //                     return value;

        //                 }
        //             }
        //         });
        //     }
        // });

        // potem spr na dotychczasowych undo/redo tests;
        

        this.args.forEach(function(arg, idx, args) {
            var path;
            if(arg) {
                if(arg.nodeType) { // ~
                    path = arg.getPath();
                    Object.defineProperty(args, idx, {
                        get: function() {
                            if(transformation.hasRun && path) {
                                return transformation.document.getNodeByPath(path);
                            } else {
                                return arg;
                            }
                        }
                    });
                } else if(_.isObject(arg)) {
                    _.keys(arg).forEach(function(key) {
                        var value = arg[key],
                            path;
                        if(value && value.nodeType) {
                            path = value.getPath();
                            Object.defineProperty(arg, key, {
                                get: function() {
                                    if(transformation.hasRun && path) {
                                        return transformation.document.getNodeByPath(path);
                                    } else {
                                        return value;
                                    }
                                }
                            });
                        }
                    });
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
            var contextPath = object.getPath(),
                transformation = this;
            Object.defineProperty(this, 'context', {
                get: function() {
                    if(transformation.hasRun) {
                        return transformation.document.getNodeByPath(contextPath);
                    } else {
                        return object;
                    }
                }
            });
        }
    };
    ContextTransformation.prototype = Object.create(GenericTransformation.prototype);
    return ContextTransformation;
};

return toret;

});