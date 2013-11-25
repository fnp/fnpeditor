define([
'libs/jquery',
], function($) {
    
'use strict';


var nearestInDocumentOrder = function(selector, direction, element) {
    var parents = $(element).parents(),
        parent = parents.length ? $(parents[parents.length-1]) : element;

    var adj = parent.find(selector).filter(function() {
        /*jshint bitwise: false*/
        return this.compareDocumentPosition(element) & (direction === 'above' ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING);
    });

    if(adj.length) {
        return adj[direction === 'above' ? adj.length-1 : 0];
    }
    return null;
};

var findCanvasElement = function(node) {
    if(node.nodeType === Node.ELEMENT_NODE) {
        return node.getData('canvasElement');
    }
    if(node.nodeType === Node.TEXT_NODE) {
        return findCanvasElementInParent(node, node.parent());
    }
};

/**
 * We take child and its parent as arguments separatly to
 * handle situation where child was removed from WLXMLDocument
 * and it lost reference to its parent (but we may still have it on canvas).
*/
var findCanvasElementInParent = function(wlxmlChildNode, wlxmlParentNode) {
    var parentElement, toret;

    if(wlxmlParentNode === null) {
        toret = wlxmlChildNode.getData('canvasElement');
        if(toret.parent()) {
            throw new Error('This should never happen: root canvas element doesn\'t render root document node!');
        }
    } else {
        parentElement = findCanvasElement(wlxmlParentNode);
        parentElement.children().forEach(function(child) {
            if(child.data('wlxmlNode').sameNode(wlxmlChildNode)) {
                toret = child;
            }
        });
    }
    return toret;
};

return {
    nearestInDocumentOrder: nearestInDocumentOrder,
    findCanvasElement: findCanvasElement,
    findCanvasElementInParent: findCanvasElementInParent,
    unicode: {
        ZWS: '\u200B'
    }
};

});
