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

var getElementForElementRootNode = function(node) {
    return node.getData('canvasElement');
};

var getElementForNode = function(node) {
    while(!node.getData('canvasElement')) {
        node = node.parent();
    }
    return node.getData('canvasElement');
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



return {
    nearestInDocumentOrder: nearestInDocumentOrder,
    unicode: {
        ZWS: '\u200B'
    },
    getElementForNode: getElementForNode,
    getElementForDetachedNode: getElementForDetachedNode,
    getElementForElementRootNode: getElementForElementRootNode
};

});
