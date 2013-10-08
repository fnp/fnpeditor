define([
    'smartxml/smartxml'
], function(smartxml) {
    
'use strict';

// utils

var isMetaAttribute = function(attrName) {
    return attrName.substr(0, 5) === 'meta-';
};

//

var WLXMLElementNode = function(nativeNode, document) {
    smartxml.ElementNode.call(this, nativeNode, document);
};
WLXMLElementNode.prototype = Object.create(smartxml.ElementNode.prototype);

$.extend(WLXMLElementNode.prototype, smartxml.ElementNode.prototype, {
    getClass: function() {
        return this.getAttr('class');
    },
    setClass: function(klass) {
        return this.setAttr('class', klass);
    },
    getMetaAttributes: function() {
        var toret = [];
        this.getAttrs().forEach(function(attr) {
            if(isMetaAttribute(attr.name)) {
                toret.push({name: attr.name.substr(5), value: attr.value});
            }
        });
        return toret;
    },
    getOtherAttributes: function() {
        var toret = {};
        this.getAttrs().forEach(function(attr) {
            if(attr.name !== 'class' && !isMetaAttribute(attr.name)) {
                toret[attr.name] = attr.value;
            }
        });
        return toret;
    }
});


var WLXMLDocument = function(xml) {
    smartxml.Document.call(this, xml);

    $(this.dom).find(':not(iframe)').addBack().contents()
    .filter(function() {return this.nodeType === Node.TEXT_NODE;})
    .each(function() {
        var el = $(this),
            text = {original: el.text(), trimmed: $.trim(el.text())},
            elParent = el.parent(),
            hasSpanParent = elParent.prop('tagName') === 'SPAN',
            hasSpanBefore = el.prev().length && $(el.prev()).prop('tagName') === 'SPAN',
            hasSpanAfter = el.next().length && $(el.next()).prop('tagName') === 'SPAN';


        text.transformed = text.trimmed;

        if(hasSpanParent || hasSpanBefore || hasSpanAfter) {
            var startSpace = /\s/g.test(text.original.substr(0,1)),
                endSpace = /\s/g.test(text.original.substr(-1)) && text.original.length > 1;
            text.transformed = (startSpace && (hasSpanParent || hasSpanBefore) ? ' ' : '');
            text.transformed += text.trimmed;
            text.transformed += (endSpace && (hasSpanParent || hasSpanAfter) ? ' ' : '');
        } else {
            if(text.trimmed.length === 0 && text.original.length > 0 && elParent.contents().length === 1) {
                text.transformed = ' ';
            }
        }

        if(!text.transformed) {
            el.remove();
            return true; // continue
        }
        el.replaceWith(document.createTextNode(text.transformed));
    });
};
WLXMLDocument.prototype = Object.create(smartxml.Document.prototype);
$.extend(WLXMLDocument.prototype, {
    ElementNodeFactory: WLXMLElementNode
});


return {
    WLXMLDocumentFromXML: function(xml) {
        return new WLXMLDocument(xml);
    },

    WLXMLElementNodeFromXML: function(xml) {
        return this.WLXMLDocumentFromXML(xml).root;
    }
};

});