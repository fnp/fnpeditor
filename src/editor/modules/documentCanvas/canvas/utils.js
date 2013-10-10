define([
'libs/jquery',
], function($) {
    
'use strict';


var nearestInDocumentOrder = function(selector, direction, element) {
    var parents = $(element).parents(),
        parent = parents.length ? $(parents[parents.length-1]) : element;

    var adj = parent.find(selector).filter(function() {
        return this.compareDocumentPosition(element) & (direction === 'above' ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING);
    });

    if(adj.length) {
        return adj[direction === 'above' ? adj.length-1 : 0];
    }
    return null;
}

var findCanvasElement = function(node) {
    if(node.nodeType === Node.ELEMENT_NODE) {
        return node.getData('canvasElement');
    }
    if(node.nodeType === Node.TEXT_NODE) {
        var parent = node.parent(),
            toret;

        parent.children().forEach(function(child) {
            if(child.data('wlxmlNode').sameNode(node))
                toret = child;
        });
        if(toret)
            return toret;
    }
};

return {
    nearestInDocumentOrder: nearestInDocumentOrder,
    findCanvasElement: findCanvasElement,
    unicode: {
        ZWS: '\u200B'
    }
};

});
