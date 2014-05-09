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

var getElementForElementRootNode = function(node, withParent) {
    if(node.nodeType === Node.TEXT_NODE) {
        return _getElementForRootTextNode(node, withParent);
    }
    return node.getData('canvasElement');
};

var _getElementForRootTextNode = function(textNode, withParent) {
    var parentElement = getElementForNode(withParent || textNode.parent()),
        toret;
    parentElement.children().some(function(child) {
        if(child.wlxmlNode.sameNode(textNode)) {
            toret = child;
            return true;
        }
    });
    return toret;
};

var getElementForNode = function(node, withParent) {
    if(node.nodeType === Node.TEXT_NODE) {
        return _getElementForTextNode(node, withParent);
    }
    while(!node.getData('canvasElement')) {
        node = node.parent();
    }
    return node.getData('canvasElement');
};

var _getElementForTextNode = function(textNode, withParent) {
    var parentElement = getElementForNode(withParent || textNode.parent()),
        toret;
    parentElement.children().some(function(child) {
        if(child.wlxmlNode.sameNode(textNode)) {
            toret = child;
            return true;
        }
    });
    return toret;
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
