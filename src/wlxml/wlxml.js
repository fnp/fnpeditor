define([
    'smartxml/smartxml'
], function(smartxml) {
    
'use strict';

// utils

var isMetaAttribute = function(attrName) {
    return attrName.substr(0, 5) === 'meta-';
};

//

var WLXMLElementNode = function(nativeNode) {
    smartxml.ElementNode.call(this, nativeNode);
};
WLXMLElementNode.prototype = Object.create(smartxml.ElementNode.prototype);

$.extend(WLXMLElementNode.prototype, smartxml.ElementNode.prototype, {
    getClass: function() {
        return this.getAttr('class');
    },
    getMetaAttributes: function() {
        var toret = {};
        this.getAttrs().forEach(function(attr) {
            if(isMetaAttribute(attr.name))
                meta[attr.name.substr(5)] = attr.value;
        });
        return toret;
    },
    getOtherAttributes: function() {
        var toret = {};
        this.getAttrs().forEach(function(attr) {
            if(attr.name != 'class' && !isMetaAttribute(attr.name))
                toret[attr.name] = attr.value;
        });
        return toret;
    }
});


var WLXMLDocument = function(xml) {
    smartxml.Document.call(this, xml);
};
WLXMLDocument.prototype = Object.create(smartxml.Document.prototype);
$.extend(WLXMLDocument.prototype, {
    ElementNodeFactory: WLXMLElementNode
});


return {
    WLXMLDocumentFromXML: function(xml) {
        return new WLXMLDocument(xml);
    }  
};

});