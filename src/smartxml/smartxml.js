define([
    'libs/jquery'
], function($) {
    
'use strict';


var TEXT_NODE = Node.TEXT_NODE;


var DocumentNode = function(nativeNode, document) {
    this.document = document;
    this.nativeNode = nativeNode;
    this._$ = $(nativeNode);
};

$.extend(DocumentNode.prototype, {
    detach: function() { this._$.detach(); },

    sameNode: function(otherNode) {
        return this.nativeNode === otherNode.nativeNode;
    },

    parent: function() {
        return this.nativeNode.parentNode ? this.document.createElementNode(this.nativeNode.parentNode) : null;
    },

    before: function(node) {
        this._$.before(node.nativeNode);
    },

    wrapWith: function(node) {
        if(this.parent()) {
            this.before(node);
        }
        node.append(this);
    },
});

var ElementNode = function(nativeNode, document) {
    DocumentNode.call(this, nativeNode, document);
};

$.extend(ElementNode.prototype, DocumentNode.prototype, {
    nodeType: Node.ELEMENT_NODE,

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

    getAttr: function(name) {
        return this._$.attr(name);
    },

    setAttr: function(name, value) {
        this._$.attr(name, value);
    },

    getAttrs: function() {
        var toret = [];
        for(var i = 0; i < this.nativeNode.attributes.length; i++) {
            toret.push(this.nativeNode.attributes[i]);
        }
        return toret;
    },

    append: function(documentNode) {
        this._$.append(documentNode.nativeNode);
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
    }

});

var TextNode = function(nativeNode, document) {
    DocumentNode.call(this, nativeNode, document);
};

$.extend(TextNode.prototype, DocumentNode.prototype, {
    nodeType: Node.TEXT_NODE,

    getText: function() {
        return this.nativeNode.data;
    },

    appendText: function(text) {
        this.nativeNode.data = this.nativeNode.data + text;
    },

    prependText: function(text) {
        this.nativeNode.data = text + this.nativeNode.data;
    }
});


var parseXML = function(xml) {
    return $(xml)[0];
};

var Document = function(xml) {
    var $document = $(parseXML(xml));

    var doc = this;
    Object.defineProperty(this, 'root', {get: function() {
        return doc.createElementNode($document[0]);
    }});
};
$.extend(Document.prototype, {
    ElementNodeFactory: ElementNode,
    TextNodeFactory: TextNode,

    createElementNode: function(nativeNode) {
        return new this.ElementNodeFactory(nativeNode, this);
    },

    createTextNode: function(nativeNode) {
        return new this.TextNodeFactory(nativeNode, this);
    }
});


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