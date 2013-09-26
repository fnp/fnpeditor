define([
    'libs/jquery'
], function($) {
    
'use strict';


var TEXT_NODE = Node.TEXT_NODE, ELEMENT_NODE = Node.ELEMENT_NODE;

var parseXML = function(xml) {
    return $(xml)[0];
}

var Document = function(nativeNode) {
    var $document = $(nativeNode);


    Object.defineProperty(this, 'root', {get: function() { return new ElementNode($document[0])}}); 
}


var ElementNode = function(nativeNode) {
    this.nativeNode = nativeNode;
    this._$ = $(nativeNode);
};

$.extend(ElementNode.prototype, {
    nodeType: Node.ELEMENT_NODE,

    getTagName: function() {
        return this.nativeNode.tagName.toLowerCase();
    },

    append: function(documentNode) {
        this._$.append(documentNode.nativeNode);
    },

    before: function(node) {
        this._$.before(node.nativeNode);
    },

    contents: function() {
        var toret = [];
        this._$.contents().each(function() {
            if(this.nodeType === Node.ELEMENT_NODE)
                toret.push(new ElementNode(this));
            else if(this.nodeType === Node.TEXT_NODE)
                toret.push(new TextNode(this));
        });
        return toret;
    },


    sameNode: function(otherNode) {
        return this.nativeNode === otherNode.nativeNode;
    },

    indexOf: function(node) {
        return this._$.contents().index(node._$);
    },

    detach: function() {
        this._$.detach();
    },

    parent: function() {
        return new ElementNode(this._$.parent());
    },

    unwrapContent: function() {
        var parent = this.parent();
        if(!parent)
            return;

        var parentContents = parent.contents(),
            myContents = this.contents(),
            myIdx = parent.indexOf(this);

        if(myContents.length === 0)
            return this.detach();

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

var TextNode = function(nativeNode) {
    this.nativeNode = nativeNode;
    this._$ = $(nativeNode);
}

$.extend(TextNode.prototype, {
    nodeType: Node.TEXT_NODE,

    detach: function() {
        this._$.detach();
    },

    getText: function() {
        return this.nativeNode.data;
    },

    appendText: function(text) {
        this.nativeNode.data = this.nativeNode.data + text;
    },

    prependText: function(text) {
        this.nativeNode.data = text + this.nativeNode.data;
    }
})


return {
    documentFromXML: function(xml) {
        return new Document(parseXML(xml));
    },

    elementNodeFromXML: function(xml) {
        return new ElementNode(parseXML(xml));
    }
};

});