define(function(require) {
    
'use strict';

var $ = require('libs/jquery'),
    _ = require('libs/underscore');


var Fragment = function(document) {
    this.document = document;
};
$.extend(Fragment.prototype, {
    isValid: function() {
        return false;
    }
});


var NodeFragment = function(document, params) {
    Fragment.call(this, document);
    this.node = params.node;
    this.nodePath = params.node.getPath();
};
NodeFragment.prototype = Object.create(Fragment.prototype);
$.extend(NodeFragment.prototype, {
    isValid: function() {
        return this.document.containsNode(this.node);
    },
    restoreFromPaths: function() {
        this.node = this.document.getNodeByPath(this.nodePath);
    }
});


var CaretFragment = function(document, params) {
    NodeFragment.call(this, document, params);
    this.offset = params.offset;

};
CaretFragment.prototype = Object.create(NodeFragment.prototype);
$.extend(CaretFragment.prototype, {
    isValid: function() {
        /* globals Node */
        return NodeFragment.prototype.isValid.call(this) &&
                this.node.nodeType === Node.TEXT_NODE &&
                _.isNumber(this.offset);
    }
});



var RangeFragment = function(document, params) {
    Fragment.call(this, document);

    if(params.node1.sameNode(params.node2)) {
        this.startNode = this.endNode = params.node1;
    } else {
        /*jshint bitwise: false*/
        /* globals Node */
        var node1First = params.node1.nativeNode.compareDocumentPosition(params.node2.nativeNode) & Node.DOCUMENT_POSITION_FOLLOWING;
        (node1First ? ['start', 'end'] : ['end','start']).forEach(function(prefix, idx) {
            this[prefix + 'Node'] = params['node'+(idx+1)];
        }.bind(this));
    }
    this.startNodePath = this.startNode.getPath();
    this.endNodePath = this.endNode.getPath();
};
RangeFragment.prototype = Object.create(Fragment.prototype);
$.extend(RangeFragment.prototype, {
    isValid: function() {
        return this.document.containsNode(this.startNode) && this.document.containsNode(this.endNode);
    },
    restoreFromPaths: function() {
        this.startNode = this.document.getNodeByPath(this.startNodePath);
        this.endNode = this.document.getNodeByPath(this.endNodePath);
    },
    hasSiblingBoundries: function() {
        return this.isValid() && this.startNode.isSiblingOf(this.endNode);
    },
    boundriesSiblingParents: function() {
        return this.startNode.document.getSiblingParents({
            node1: this.startNode,
            node2: this.endNode
        });
    },
    getCommonParent: function() {
        var siblingParents = this.boundriesSiblingParents();
        if(siblingParents) {
            return siblingParents.node1.parent();
        }
    },
});

var TextRangeFragment = function(document, params) {
    var orderChanged;

    RangeFragment.call(this, document, params);

    if(this.startNode.sameNode(this.endNode)) {
        this.startOffset = Math.min(params.offset1, params.offset2);
        this.endOffset = Math.max(params.offset1, params.offset2);
    } else {
        orderChanged =  !params.node1.sameNode(this.startNode);
        this.startOffset = orderChanged ? params.offset2 : params.offset1;
        this.endOffset = orderChanged ? params.offset1 : params.offset2;
    }
};
TextRangeFragment.prototype = Object.create(RangeFragment.prototype);
$.extend(TextRangeFragment.prototype, {
    isValid: function() {
        return RangeFragment.prototype.isValid.call(this) &&
            _.isNumber(this.startOffset) &&
            _.isNumber(this.endOffset);
    }
});

var FragmentTypes = {
    Fragment: Fragment,
    NodeFragment: NodeFragment,
    CaretFragment: CaretFragment,
    RangeFragment: RangeFragment,
    TextRangeFragment: TextRangeFragment
};
_.values(FragmentTypes).forEach(function(Type) {
    $.extend(Type.prototype, FragmentTypes);
});

return FragmentTypes;

});