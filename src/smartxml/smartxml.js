define([
    'libs/jquery',
    'libs/underscore',
    'libs/backbone',
    'smartxml/events'
], function($, _, Backbone, events) {
    
'use strict';


var TEXT_NODE = Node.TEXT_NODE;


var DocumentNode = function(nativeNode, document) {
    if(!document) {
        throw new Error('undefined document for a node');
    }
    this.document = document;
    this._setNativeNode(nativeNode);

};

$.extend(DocumentNode.prototype, {
    _setNativeNode: function(nativeNode) {
        this.nativeNode = nativeNode;
        this._$ = $(nativeNode);
    },

    detach: function() {
        this._$.detach();
        return this;
    },

    sameNode: function(otherNode) {
        return otherNode && this.nativeNode === otherNode.nativeNode;
    },

    parent: function() {
        return this.nativeNode.parentNode ? this.document.createElementNode(this.nativeNode.parentNode) : null;
    },

    after: function(node) {
        var insertion = this.getNodeInsertion(node);
        this._$.after(insertion.ofNode.nativeNode);
        this.triggerChangeEvent(insertion.insertsNew ? 'nodeAdded' : 'nodeMoved', {node: insertion.ofNode});
        return insertion.ofNode;
    },

    before: function(node) {
        var insertion = this.getNodeInsertion(node);
        this._$.before(insertion.ofNode.nativeNode);
        this.triggerChangeEvent(insertion.insertsNew ? 'nodeAdded' : 'nodeMoved', {node: insertion.ofNode});
        return insertion.ofNode;
    },

    wrapWith: function(node) {
        node = node instanceof ElementNode ? node : this.document.createElementNode(node);

        if(this.parent()) {
            this.before(node);
        }
        node.append(this);
        return node;
    },

    triggerChangeEvent: function(type, metaData) {
        var event = new events.ChangeEvent(type, $.extend({node: this}, metaData || {}));
        this.document.trigger('change', event);
    },
    
    getNodeInsertion: function(node) {
        var insertion = {};
        if(node instanceof DocumentNode) {
            insertion.ofNode = node;
            insertion.insertsNew = !this.document.containsNode(node);
        } else {
          insertion.ofNode = this.document.createElementNode(node);
          insertion.insertsNew = true;
        }
        return insertion;
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

    contents: function() {
        var toret = [],
            document = this.document;
        this._$.contents().each(function() {
            if(this.nodeType === Node.ELEMENT_NODE) {
                toret.push(document.createElementNode(this));
            }
            else if(this.nodeType === Node.TEXT_NODE) {
                toret.push(document.createTextNode(this));
            }
        });
        return toret;
    },

    indexOf: function(node) {
        return this._$.contents().index(node._$);
    },

    setTag: function(tagName) {
        var node = this.document.createElementNode({tagName: tagName}),
            oldTagName = this.getTagName(),
            myContents = this._$.contents();

        this.getAttrs().forEach(function(attribute) {
            node.setAttr(attribute.name, attribute.value, true);
        });
        node.setData(this.getData());

        if(this.sameNode(this.document.root)) {
            defineDocumentProperties(this.document, node._$);
        }
        this._$.replaceWith(node._$);
        this._setNativeNode(node._$[0]);
        this._$.append(myContents);
        this.triggerChangeEvent('nodeTagChange', {oldTagName: oldTagName, newTagName: this.getTagName()});
    },

    getAttr: function(name) {
        return this._$.attr(name);
    },

    setAttr: function(name, value, silent) {
        var oldVal = this.getAttr(name);
        this._$.attr(name, value);
        if(!silent) {
            this.triggerChangeEvent('nodeAttrChange', {attr: name, oldVal: oldVal, newVal: value});
        }
    },

    getAttrs: function() {
        var toret = [];
        for(var i = 0; i < this.nativeNode.attributes.length; i++) {
            toret.push(this.nativeNode.attributes[i]);
        }
        return toret;
    },

    append: function(node) {
        var insertion = this.getNodeInsertion(node);
        this._$.append(insertion.ofNode.nativeNode);
        this.triggerChangeEvent(insertion.insertsNew ? 'nodeAdded' : 'nodeMoved', {node: insertion.ofNode});
        return insertion.ofNode;
    },

    prepend: function(node) {
        var insertion = this.getNodeInsertion(node);
        this._$.prepend(insertion.ofNode.nativeNode);
        this.triggerChangeEvent(insertion.insertsNew ? 'nodeAdded' : 'nodeMoved', {node: insertion.ofNode});
        return insertion.ofNode;
    },

    unwrapContent: function() {
        var parent = this.parent();
        if(!parent) {
            return;
        }

        var parentContents = parent.contents(),
            myContents = this.contents(),
            myIdx = parent.indexOf(this);

        if(myContents.length === 0) {
            return this.detach();
        }

        var moveLeftRange, moveRightRange, leftMerged;

        if(myIdx > 0 && (parentContents[myIdx-1].nodeType === TEXT_NODE) && (myContents[0].nodeType === TEXT_NODE)) {
            parentContents[myIdx-1].appendText(myContents[0].getText());
            myContents[0].detach();
            moveLeftRange = true;
            leftMerged = true;
        } else {
            leftMerged = false;
        }

        if(!(leftMerged && myContents.length === 1)) {
            if(myIdx < parentContents.length - 1 && (parentContents[myIdx+1].nodeType === TEXT_NODE) && (myContents[myContents.length-1].nodeType === TEXT_NODE)) {
                parentContents[myIdx+1].prependText(myContents[myContents.length-1].getText());
                myContents[myContents.length-1].detach();
                moveRightRange = true;
            }
        }

        var childrenLength = this.contents().length;
        this.contents().forEach(function(child) {
            this.before(child);
        }.bind(this));

        this.detach();

        return {
            element1: parent.contents()[myIdx + (moveLeftRange ? -1 : 0)],
            element2: parent.contents()[myIdx + childrenLength-1 + (moveRightRange ? 1 : 0)]
        };
    },

    wrapText: function(params) {
        return this.document._wrapText(_.extend({inside: this}, params));
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

    setText: function(text) {
        this.nativeNode.data = text;
        this.triggerTextChangeEvent();
    },

    appendText: function(text) {
        this.nativeNode.data = this.nativeNode.data + text;
        this.triggerTextChangeEvent();
    },

    prependText: function(text) {
        this.nativeNode.data = text + this.nativeNode.data;
        this.triggerTextChangeEvent();
    },

    wrapWith: function(desc) {
        if(typeof desc.start === 'number' && typeof desc.end === 'number') {
            return this.document._wrapText({
                inside: this.parent(),
                textNodeIdx: this.parent().indexOf(this),
                offsetStart: Math.min(desc.start, desc.end),
                offsetEnd: Math.max(desc.start, desc.end),
                _with: {tag: desc.tagName, attrs: desc.attrs}
            });
        } else {
            return DocumentNode.prototype.wrapWith.call(this, desc);
        }
    },

    triggerTextChangeEvent: function() {
        var event = new events.ChangeEvent('nodeTextChange', {node: this});
        this.document.trigger('change', event);
    }
});


var parseXML = function(xml) {
    return $(xml)[0];
};

var Document = function(xml) {
    this.loadXML(xml);
};

$.extend(Document.prototype, Backbone.Events, {
    ElementNodeFactory: ElementNode,
    TextNodeFactory: TextNode,

    createElementNode: function(from) {
        if(!(from instanceof HTMLElement)) {
            if(from.text) {
                from = document.createTextNode(from.text);
            } else {
                var node = $('<' + from.tagName + '>');

                _.keys(from.attrs || {}).forEach(function(key) {
                    node.attr(key, from.attrs[key]);
                });

                from = node[0];
            }
        }
        return new this.ElementNodeFactory(from, this);
    },

    createTextNode: function(nativeNode) {
        return new this.TextNodeFactory(nativeNode, this);
    },

    loadXML: function(xml, options) {
        options = options || {};
        defineDocumentProperties(this, $(parseXML(xml)));
        if(!options.silent) {
            this.trigger('contentSet');
        }
    },

    toXML: function() {
        return this.root.toXML();
    },

    containsNode: function(node) {
        return node._$.parents().index(this.root._$) !== -1;
    },

    wrapNodes: function(params) {
        if(!(params.element1.parent().sameNode(params.element2.parent()))) {
            throw new Error('Wrapping non-sibling nodes not supported.');
        }

        var parent = params.element1.parent(),
            parentContents = parent.contents(),
            wrapper = this.createElementNode({
                tagName: params._with.tagName,
                attrs: params._with.attrs}),
            idx1 = parent.indexOf(params.element1),
            idx2 = parent.indexOf(params.element2);

        if(idx1 > idx2) {
            var tmp = idx1;
            idx1 = idx2;
            idx2 = tmp;
        }

        var insertingMethod, insertingTarget;
        if(idx1 === 0) {
            insertingMethod = 'prepend';
            insertingTarget = parent;
        } else {
            insertingMethod = 'after';
            insertingTarget = parentContents[idx1-1];
        }

        for(var i = idx1; i <= idx2; i++) {
            wrapper.append(parentContents[i].detach());
        }

        insertingTarget[insertingMethod](wrapper);
        return wrapper;
    },

    _wrapText: function(params) {
        params = _.extend({textNodeIdx: 0}, params);
        if(typeof params.textNodeIdx === 'number') {
            params.textNodeIdx = [params.textNodeIdx];
        }
        
        var contentsInside = params.inside.contents(),
            idx1 = Math.min.apply(Math, params.textNodeIdx),
            idx2 = Math.max.apply(Math, params.textNodeIdx),
            textNode1 = contentsInside[idx1],
            textNode2 = contentsInside[idx2],
            sameNode = textNode1.sameNode(textNode2),
            prefixOutside = textNode1.getText().substr(0, params.offsetStart),
            prefixInside = textNode1.getText().substr(params.offsetStart),
            suffixInside = textNode2.getText().substr(0, params.offsetEnd),
            suffixOutside = textNode2.getText().substr(params.offsetEnd)
        ;

        if(!(textNode1.parent().sameNode(textNode2.parent()))) {
            throw new Error('Wrapping text in non-sibling text nodes not supported.');
        }
        
        var wrapperElement = this.createElementNode({tagName: params._with.tag, attrs: params._with.attrs});
        textNode1.after(wrapperElement);
        textNode1.detach();
        
        if(prefixOutside.length > 0) {
            wrapperElement.before({text:prefixOutside});
        }
        if(sameNode) {
            var core = textNode1.getText().substr(params.offsetStart, params.offsetEnd - params.offsetStart);
            wrapperElement.append({text: core});
        } else {
            textNode2.detach();
            if(prefixInside.length > 0) {
                wrapperElement.append({text: prefixInside});
            }
            for(var i = idx1 + 1; i < idx2; i++) {
                wrapperElement.append(contentsInside[i]);
            }
            if(suffixInside.length > 0) {
                wrapperElement.append({text: suffixInside});
            }
        }
        if(suffixOutside.length > 0) {
            wrapperElement.after({text: suffixOutside});
        }
        return wrapperElement;
    }
});

var defineDocumentProperties = function(doc, $document) {
    Object.defineProperty(doc, 'root', {get: function() {
        return doc.createElementNode($document[0]);
    }, configurable: true});
    Object.defineProperty(doc, 'dom', {get: function() {
        return $document[0];
    }, configurable: true});
};

return {
    documentFromXML: function(xml) {
        return new Document(parseXML(xml));
    },

    elementNodeFromXML: function(xml) {
        return this.documentFromXML(xml).root;
    },

    Document: Document,
    DocumentNode: DocumentNode,
    ElementNode: ElementNode
};

});