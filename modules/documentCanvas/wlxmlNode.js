define(['libs/jquery-1.9.1.min'], function($) {
    
'use strict';

var tagSelector = '[wlxml-tag]';

var Node = function(domNode) {
       
    return {
        id: domNode.attr('id'),
        tag: domNode.attr('wlxml-tag'),
        klass: domNode.attr('wlxml-class'),
        parent: function() {
            var node = domNode.parent(tagSelector);
            if(node.length)
                return new Node(node);
            return null;
        },
        children: function() {
            var list = [];
            domNode.children(tagSelector).each(function() {
                list.push(new Node($(this)));
            });
            return $(list);
        },
        parents: function() {
            var list = [];
            domNode.parents(tagSelector).each(function() {
                list.push(new Node($(this)));
            });
            return $(list);
        }
    }

};

return { Node: Node}

});