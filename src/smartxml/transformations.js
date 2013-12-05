define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    toret = {};

var getTransDesc = function(desc, name) {
    if(typeof desc === 'function') {
        desc = {impl: desc};
    }
    if(!desc.impl) {
        throw new Error('Got transformation description without implementation.')
    }
    return desc;
};

toret.createGenericTransformation = function(desc, name) {
    desc = getTransDesc(desc);
    
    var GenericTransformation = function(document, args) {
        this.args = args || {};

        var transformation = this;
        _.keys(this.args).forEach(function(key) {
            if(transformation.args[key].nodeType) { //@@ change to instanceof check, fix circular dependency
                var value = transformation.args[key],
                    path = value.getPath();
                Object.defineProperty(transformation.args, key, {
                    get: function() {
                        if(transformation.hasRun) {
                            //console.log('returning via path');
                            return transformation.document.getNodeByPath(path);
                        } else {
                            //console.log('returning original arg');
                            return value;

                        }
                    }
                });
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
        run: function() {
            var changeRoot;
            if(!desc.undo) {
                changeRoot = desc.getChangeRoot ? desc.getChangeRoot.call(this) : this.document.root;
                this.snapshot = changeRoot.clone();
                this.changeRootPath = changeRoot.getPath();
            }
            var toret = desc.impl.call(this.context, this.args); // a argumenty do metody?
            this.hasRun = true;
            return toret;
        },
        undo: function() {
            if(desc.undo) {
                desc.undo.call(this.context);
            } else {
                this.document.getNodeByPath(this.changeRootPath).replaceWith(this.snapshot);
            }
        },
    });

    return GenericTransformation;
};
// var T = createGenericTransformation({impl: function() {}});
// var t = T(doc, {a:1,b:2,c3:3});


toret.createContextTransformation = function(desc, name) {
    // mozna sie pozbyc przez przeniesienie object/context na koniec argumentow konstruktora generic transformation
    var GenericTransformation = toret.createGenericTransformation(desc, name);

    var ContextTransformation = function(document, object, args) {
        GenericTransformation.call(this, document, args);

        if(document === object) {
            this.context = document;
        } else {      
            var contextPath = object.getPath();
            Object.defineProperty(this, 'context', {
                get: function() {
                    // todo: to jakos inaczej, bo np. this.context w undo transformacji before to juz nie ten sam obiekt
                    // moze transformacja powinna zwracac zmodyfikowana sciezke do obiektu po dzialaniu run?
                    
                    // tu tez trick z hasRun
                    return document.getNodeByPath(contextPath);
                }
            });
        }
    }
    ContextTransformation.prototype = Object.create(GenericTransformation.prototype);
    return ContextTransformation;
}
// var T = createContextTransformation({impl: function() {}});
// var t = T(doc, node, {a:1,b:2,c3:3});
///



toret.TransformationStorage = function() {
    this._transformations = {};
};

_.extend(toret.TransformationStorage.prototype, {
    
    register: function(Transformation) {
        var list = (this._transformations[Transformation.prototype.name] = this._transformations[Transformation.prototype.name] || []);
        list.push(Transformation);
    },

    get: function(name) {
        var transformations = this._transformations[name];
        if(!transformations) {
            throw new Error('Transformation "' + name + '" not found!');
        }
        // na razie zwraca pierwsza
        return transformations[0];
    }
});



// var registerTransformationFromMethod = (object, methodName, desc) {
//         if(!object[methodName]) {
//             throw new Exeption('Cannot register transformation from unknown method ' + methodName + ' on ' + object);
//         }
//         desc.impl = object[name];
//         Transformation = createContextTransformation(desc);
//         object.prototype.registerContextTransformation(name, createContextTransformation(method));
// };


// registerTransformationFromMethod(ElementNode, 'setAttr', {
//     impl: function(args) {
//         this.setAttr(args.name, args.value);
//     },
//     getChangeRoot: function() {
//         return this.context;
//     }

// });

return toret;

});