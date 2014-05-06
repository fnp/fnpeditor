define([
'libs/jquery',
], function($) {
    
'use strict';
/* globals Node */

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


var getElementForNode = function(node) {

    var ptr = node.nodeType === Node.TEXT_NODE ? node.parent() : node;
    while(!ptr.getData('canvasElement')) {
        ptr = ptr.parent();
    }
    return ptr.getData('canvasElement');
};

var getElementForDetachedNode = function(node, originalParent) {
    var ptr = originalParent;
    if(ptr === null) {
        return node.getData('canvasElement');
    }
    while(!ptr.getData('canvasElement')) {
        ptr = ptr.parent();
    }
    return ptr.getData('canvasElement');
};

var getElementForTextNode = function(textNode) {
    var parentElement = getElementForNode(textNode.parent()),
        toret;
    parentElement.children().some(function(child) {
        if(child.wlxmlNode.sameNode(textNode)) {
            toret = child;
            return true;
        }
    });
    return toret;
};

return {
    nearestInDocumentOrder: nearestInDocumentOrder,
    unicode: {
        ZWS: '\u200B'
    },
    getElementForNode: getElementForNode,
    getElementForDetachedNode: getElementForDetachedNode,
    getElementForTextNode: getElementForTextNode
};

});
