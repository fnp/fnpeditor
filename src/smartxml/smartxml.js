define([
    'libs/jquery'
], function($) {
    
'use strict';


var Document = function(xml) {
    var $document = $(xml);


    Object.defineProperty(this, 'root', {get: function() { return new ElementNode($document[0])}}); 
}


var ElementNode = function(nativeNode) {
    var myNode = nativeNode,
        $myNode = $(nativeNode);


    this.getTagName = function() {
        return myNode.tagName.toLowerCase();
    }
};

return {
    fromXML: function(xml) {
        return new Document(xml);
    }
};

});