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
        });
        return toret;
    },


    sameNode: function(otherNode) {
        return this.nativeNode === otherNode.nativeNode;
    }

});

return {
    documentFromXML: function(xml) {
        return new Document(parseXML(xml));
    },

    elementNodeFromXML: function(xml) {
        return new ElementNode(parseXML(xml));
    }
};

});