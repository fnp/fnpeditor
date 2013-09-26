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
    var myNode = nativeNode,
        $myNode = $(nativeNode);

    this._$myNode = $myNode;
    this._myNode= myNode;

    this.getTagName = function() {
        return myNode.tagName.toLowerCase();
    };

    this.append = function(documentNode) {
        this._$myNode.append(documentNode._$myNode);
    };

    this.contents = function() {
        var toret = [];
        this._$myNode.contents().each(function() {
            if(this.nodeType === Node.ELEMENT_NODE)
                toret.push(new ElementNode(this));
        });
        return toret;
    };

    this.sameNode = function(otherNode) {
        return this._myNode === otherNode._myNode;
    }
};

return {
    documentFromXML: function(xml) {
        return new Document(parseXML(xml));
    },

    elementNodeFromXML: function(xml) {
        return new ElementNode(parseXML(xml));
    }
};

});