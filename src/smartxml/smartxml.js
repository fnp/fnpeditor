define([
    'libs/jquery',
    'libs/underscore',
    'libs/backbone',
    'smartxml/events',
    'smartxml/transformations',
    'smartxml/core'
], function($, _, Backbone, events, transformations, coreTransformations) {
    
'use strict';
/* globals Node */


var DocumentNode = function(nativeNode, document) {
    if(!document) {
        throw new Error('undefined document for a node');
    }
    this.document = document;
    this._setNativeNode(nativeNode);

};

$.extend(DocumentNode.prototype, {

    transform: function(Transformation, args) {
        var transformation = new Transformation(this.document, this, args);
        return this.document.transform(transformation);
    },

    _setNativeNode: function(nativeNode) {
        this.nativeNode = nativeNode;
        this._$ = $(nativeNode);
    },

    clone: function() {
        var clone = this._$.clone(true, true);
        return this.document.createDocumentNode(clone[0]);
    },

    getPath: function(ancestor) {
        if(!(this.document.containsNode(this))) {
            return null;
        }

        var nodePath = [this].concat(this.parents()),
            toret, idx;
        ancestor = ancestor || this.document.root;

        nodePath.some(function(node, i) {
            if(node.sameNode(ancestor)) {
                idx = i;
                return true;
            }
        });

        if(idx !== 'undefined') {
            nodePath = nodePath.slice(0, idx);
        }
        toret = nodePath.map(function(node) {return node.getIndex(); });
        toret.reverse();
        return toret;
    },

    isRoot: function() {
        return this.document.root.sameNode(this);
    },

    sameNode: function(otherNode) {
        return !!(otherNode) && this.nativeNode === otherNode.nativeNode;
    },

    parent: function() {
        var parentNode = this.nativeNode.parentNode;
        if(parentNode && parentNode.nodeType === Node.ELEMENT_NODE) {
            return this.document.createDocumentNode(parentNode);
        }
        return null;
    },

    parents: function() {
        var parent = this.parent(),
            parents = parent ? parent.parents() : [];
        if(parent) {
            parents.unshift(parent);
        }
        return parents;
    },

    prev: function() {
        var myIdx = this.getIndex();
        return myIdx > 0 ? this.parent().contents()[myIdx-1] : null;
    },

    next: function() {
        if(this.isRoot()) {
            return null;
        }
        var myIdx = this.getIndex(),
            parentContents = this.parent().contents();
        return myIdx < parentContents.length - 1 ? parentContents[myIdx+1] : null;
    },

    isSurroundedByTextElements: function() {
        var prev = this.prev(),
            next = this.next();
        return prev && (prev.nodeType === Node.TEXT_NODE) && next && (next.nodeType === Node.TEXT_NODE);
    },

    triggerChangeEvent: function(type, metaData, origParent, nodeWasContained) {
        var node = (metaData && metaData.node) ? metaData.node : this,
            event = new events.ChangeEvent(type, $.extend({node: node}, metaData || {}));
        if(type === 'nodeDetached' || this.document.containsNode(event.meta.node)) {
            this.document.trigger('change', event);
        }
        if((type === 'nodeAdded' || type === 'nodeMoved') && !this.document.containsNode(this) && nodeWasContained) {
             event = new events.ChangeEvent('nodeDetached', {node: node, parent: origParent});
             this.document.trigger('change', event);
        }
    },
    
    getNodeInsertion: function(node) {
        return this.document.getNodeInsertion(node);
    },

    getIndex: function() {
        if(this.isRoot()) {
            return 0;
        }
        return this.parent().indexOf(this);
    }
});


var ElementNode = function(nativeNode, document) {
    DocumentNode.call(this, nativeNode, document);
};
ElementNode.prototype = Object.create(DocumentNode.prototype);

$.extend(ElementNode.prototype, {
    nodeType: Node.ELEMENT_NODE,

    setData: function(key, value) {
        if(value !== undefined) {
            this._$.data(key, value);
        } else {
            this._$.removeData(_.keys(this._$.data()));
            this._$.data(key);
        }
    },

    getData: function(key) {
        if(key) {
            return this._$.data(key);
        }
        return this._$.data();
    },

    getTagName: function() {
        return this.nativeNode.tagName.toLowerCase();
    },

    contents: function(selector) {
        var toret = [],
            document = this.document;
        if(selector) {
            this._$.children(selector).each(function() {
                toret.push(document.createDocumentNode(this));
            });
        } else {
            this._$.contents().each(function() {
                toret.push(document.createDocumentNode(this));
            });
        }
        return toret;
    },

    indexOf: function(node) {
        return this._$.contents().index(node._$);
    },

    getAttr: function(name) {
        return this._$.attr(name);
    },

    getAttrs: function() {
        var toret = [];
        for(var i = 0; i < this.nativeNode.attributes.length; i++) {
            toret.push(this.nativeNode.attributes[i]);
        }
        return toret;
    },

    toXML: function() {
        var wrapper = $('<div>');
        wrapper.append(this._getXMLDOMToDump());
        return wrapper.html();
    },
    
    _getXMLDOMToDump: function() {
        return this._$;
    }
});


var TextNode = function(nativeNode, document) {
    DocumentNode.call(this, nativeNode, document);
};
TextNode.prototype = Object.create(DocumentNode.prototype);

$.extend(TextNode.prototype, {
    nodeType: Node.TEXT_NODE,

    getText: function() {
        return this.nativeNode.data;
    },

    triggerTextChangeEvent: function() {
        var event = new events.ChangeEvent('nodeTextChange', {node: this});
        this.document.trigger('change', event);
    }
});


var parseXML = function(xml) {
    return $($.trim(xml))[0];
};

var registerTransformation = function(desc, name, target) {
    var Transformation = transformations.createContextTransformation(desc, name);
    target[name] = function() {
        var instance = this,
            args = Array.prototype.slice.call(arguments, 0);
        return instance.transform(Transformation, args);
    };
};

var registerMethod = function(methodName, method, target) {
    if(target[methodName]) {
        throw new Error('Cannot extend {target} with method name {methodName}. Name already exists.'
            .replace('{target}', target)
            .replace('{methodName}', methodName)
        );
    }
    target[methodName] = method;
};


var Document = function(xml) {
    this.loadXML(xml);
    this.undoStack = [];
    this.redoStack = [];
    this._transactionStack = [];
    this._transformationLevel = 0;
    
    this._nodeMethods = {};
    this._textNodeMethods = {};
    this._elementNodeMethods = {};
    this._nodeTransformations = {};
    this._textNodeTransformations = {};
    this._elementNodeTransformations = {};
    
    this.registerExtension(coreTransformations);
};

$.extend(Document.prototype, Backbone.Events, {
    ElementNodeFactory: ElementNode,
    TextNodeFactory: TextNode,

    createDocumentNode: function(from) {
        if(!(from instanceof Node)) {
            if(typeof from === 'string') {
                from = parseXML(from);
                this.normalizeXML(from);
            } else {
                if(from.text !== undefined) {
                    /* globals document */
                    from = document.createTextNode(from.text);
                } else {
                    var node = $('<' + from.tagName + '>');

                    _.keys(from.attrs || {}).forEach(function(key) {
                        node.attr(key, from.attrs[key]);
                    });

                    from = node[0];
                }
            }
        }
        var Factory, typeMethods, typeTransformations;
        if(from.nodeType === Node.TEXT_NODE) {
            Factory = this.TextNodeFactory;
            typeMethods = this._textNodeMethods;
            typeTransformations = this._textNodeTransformations;
        } else if(from.nodeType === Node.ELEMENT_NODE) {
            Factory = this.ElementNodeFactory;
            typeMethods = this._elementNodeMethods;
            typeTransformations = this._elementNodeTransformations;
        }
        var toret = new Factory(from, this);
        _.extend(toret, this._nodeMethods);
        _.extend(toret, typeMethods);
        
        _.extend(toret, this._nodeTransformations);
        _.extend(toret, typeTransformations);
        
        toret.__super__ = _.extend({}, this._nodeMethods, this._nodeTransformations);
        _.keys(toret.__super__).forEach(function(key) {
            toret.__super__[key] = _.bind(toret.__super__[key], toret);
        });

        return toret;
    },

    loadXML: function(xml, options) {
        options = options || {};
        this._defineDocumentProperties($(parseXML(xml)));
        this.normalizeXML(this.dom);
        if(!options.silent) {
            this.trigger('contentSet');
        }
    },

    normalizeXML: function(nativeNode) {
        void(nativeNode); // noop
    },

    toXML: function() {
        return this.root.toXML();
    },

    containsNode: function(node) {
        return this.root && (node.nativeNode === this.root.nativeNode || node._$.parents().index(this.root._$) !== -1);
    },

    getSiblingParents: function(params) {
        var parents1 = [params.node1].concat(params.node1.parents()).reverse(),
            parents2 = [params.node2].concat(params.node2.parents()).reverse(),
            noSiblingParents = null;

        if(parents1.length === 0 || parents2.length === 0 || !(parents1[0].sameNode(parents2[0]))) {
            return noSiblingParents;
        }

        var i;
        for(i = 0; i < Math.min(parents1.length, parents2.length); i++) {
            if(parents1[i].sameNode(parents2[i])) {
                continue;
            }
            break;
        }
        return {node1: parents1[i], node2: parents2[i]};
    },

    trigger: function() {
        Backbone.Events.trigger.apply(this, arguments);
    },

    getNodeInsertion: function(node) {
        var insertion = {};
        if(node instanceof DocumentNode) {
            insertion.ofNode = node;
            insertion.insertsNew = !this.containsNode(node);
        } else {
          insertion.ofNode = this.createDocumentNode(node);
          insertion.insertsNew = true;
        }
        return insertion;
    },

    registerMethod: function(methodName, method, dstName) {
        var doc = this;
        var destination = {
            document: doc,
            documentNode: doc._nodeMethods,
            textNode: doc._textNodeMethods,
            elementNode: doc._elementNodeMethods
        }[dstName];
        registerMethod(methodName, method, destination);
    },

    registerTransformation: function(desc, name, dstName) {
        var doc = this;
        var destination = {
            document: doc,
            documentNode: doc._nodeTransformations,
            textNode: doc._textNodeTransformations,
            elementNode: doc._elementNodeTransformations
        }[dstName];
        registerTransformation(desc, name, destination);
    },

    registerExtension: function(extension) {
        var doc = this;

        ['document', 'documentNode', 'elementNode', 'textNode'].forEach(function(dstName) {
            var dstExtension = extension[dstName];
            if(dstExtension) {
                if(dstExtension.methods) {
                    _.pairs(dstExtension.methods).forEach(function(pair) {
                        var methodName = pair[0],
                            method = pair[1];

                        doc.registerMethod(methodName, method, dstName);

                    });
                }

                if(dstExtension.transformations) {
                    _.pairs(dstExtension.transformations).forEach(function(pair) {
                        var name = pair[0],
                            desc = pair[1];
                        doc.registerTransformation(desc, name, dstName);
                    });
                }
            }
        });
    },

    transform: function(Transformation, args) {
        var toret, transformation;

        if(typeof Transformation === 'function') {
            transformation = new Transformation(this, this, args);
        } else {
            transformation = Transformation;
        }
        if(transformation) {
            this._transformationLevel++;
            toret = transformation.run({beUndoable:this._transformationLevel === 1});
            if(this._transformationLevel === 1 && !this._undoInProgress) {
                if(this._transactionInProgress) {
                    this._transactionStack.push(transformation);
                } else {
                    this.undoStack.push(transformation);
                }
            }
            if(!this._undoInProgress && this._transformationLevel === 1) {
                this.redoStack = [];
            }
            this._transformationLevel--;
            return toret;
        } else {
            throw new Error('Transformation ' + transformation + ' doesn\'t exist!');
        }
    },
    undo: function() {
        var transformationObject = this.undoStack.pop(),
            doc = this,
            transformations, stopAt;

        if(transformationObject) {
            this._undoInProgress = true;

            if(_.isArray(transformationObject)) {
                // We will modify this array in a minute so make sure we work on a copy.
                transformations = transformationObject.slice(0);
            } else {
                // Lets normalize single transformation to a transaction containing one transformation.
                transformations = [transformationObject];
            }

            if(transformations.length > 1) {
                // In case of real transactions we don't want to run undo on all of transformations if we don't have to.
                stopAt = undefined;
                transformations.some(function(t, idx) {
                    if(!t.undo && t.getChangeRoot().sameNode(doc.root)) {
                        stopAt = idx;
                        return true; //break
                    }
                });
                if(stopAt !== undefined) {
                    // We will get away with undoing only this transformations as the one at stopAt reverses the whole document.
                    transformations = transformations.slice(0, stopAt+1);
                }
            }

            transformations.reverse();
            transformations.forEach(function(t) {
                t.undo();
            });

            this._undoInProgress = false;
            this.redoStack.push(transformationObject);
        }
    },
    redo: function() {
        var transformationObject = this.redoStack.pop(),
            transformations;
        if(transformationObject) {
            this._transformationLevel++;
            transformations = _.isArray(transformationObject) ? transformationObject : [transformationObject];
            transformations.forEach(function(t) {
                t.run({beUndoable: true});
            });
            this._transformationLevel--;
            this.undoStack.push(transformationObject);
        }
    },

    startTransaction: function() {
        if(this._transactionInProgress) {
            throw new Error('Nested transactions not supported!');
        }
        this._transactionInProgress = true;
    },

    endTransaction: function() {
        if(!this._transactionInProgress) {
            throw new Error('End of transaction requested, but there is no transaction in progress!');
        }
        this._transactionInProgress = false;
        this.undoStack.push(this._transactionStack);
        this._transactionStack = [];
    },

    getNodeByPath: function(path) {
        var toret = this.root;
        path.forEach(function(idx) {
            toret = toret.contents()[idx];
        });
        return toret;
    },

    _defineDocumentProperties: function($document) {
        var doc = this;
        Object.defineProperty(doc, 'root', {get: function() {
            return doc.createDocumentNode($document[0]);
        }, configurable: true});
        Object.defineProperty(doc, 'dom', {get: function() {
            return $document[0];
        }, configurable: true});
    }
});


return {
    documentFromXML: function(xml) {
        var doc = new Document(xml);
        return doc;
    },

    elementNodeFromXML: function(xml) {
        return this.documentFromXML(xml).root;
    },

    Document: Document,
    DocumentNode: DocumentNode,
    ElementNode: ElementNode,
    TextNode: TextNode
};

});