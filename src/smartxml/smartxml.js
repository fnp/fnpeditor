define([
    'libs/jquery'
], function($) {
    
'use strict';


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
    }

});

var TextNode = function(nativeNode) {
    this.nativeNode = nativeNode;
    this._$ = $(nativeNode);
}

$.extend(TextNode.prototype, {
    nodeType: Node.TEXT_NODE
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