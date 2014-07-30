define(function(require) {
    
'use strict';

var $ = require('libs/jquery');

var Selection = function(canvas, params) {
    this.canvas = canvas;
    $.extend(this, params);
};

var CaretSelection = function(canvas, params) {
    Selection.call(this, canvas, params);
};
CaretSelection.prototype = Object.create(Selection.prototype);
$.extend(CaretSelection.prototype, {
    toDocumentFragment: function() {
        var doc = this.canvas.wlxmlDocument;
        return doc.createFragment(doc.CaretFragment, {node: this.element.wlxmlNode, offset: this.offset});
    }
});

var TextSelection = function(canvas, params) {
    Selection.call(this, canvas, params);
};
TextSelection.prototype = Object.create(Selection.prototype);
$.extend(TextSelection.prototype, {
    toDocumentFragment: function() {
        var doc = this.canvas.wlxmlDocument,
            anchorNode = this.anchorElement ? this.anchorElement.wlxmlNode : null,
            focusNode = this.focusElement ? this.focusElement.wlxmlNode : null;
        
        if(!anchorNode || !focusNode) {
            return;
        }

        if(anchorNode.isSiblingOf(focusNode)) {
            return doc.createFragment(doc.TextRangeFragment, {
                node1: anchorNode,
                offset1: this.anchorOffset,
                node2: focusNode,
                offset2: this.focusOffset,
            });
        }
        else {
            var siblingParents = doc.getSiblingParents({node1: anchorNode, node2: focusNode});
            return doc.createFragment(doc.RangeFragment, {
                node1: siblingParents.node1,
                node2: siblingParents.node2
            });
        }
    }
});

var NodeSelection = function(canvas, params) {
    Selection.call(this, canvas, params);
};
NodeSelection.prototype = Object.create(Selection.prototype);
$.extend(NodeSelection.prototype, {
    toDocumentFragment: function() {
        var doc = this.canvas.wlxmlDocument;
        doc.createFragment(doc.NodeFragment, {node: this.element.wlxmlNode});
    }
});


var isText = function(node) {
    /* globals Node */
    return node && node.nodeType === Node.TEXT_NODE && $(node.parentNode).is('[document-text-element]');
};

var types = {
    caret: CaretSelection,
    textSelection: TextSelection,
    nodeSelection: NodeSelection
};

return {
    fromParams: function(canvas, params) {
        return new types[params.type](canvas, params);
    },
    fromNativeSelection: function(canvas) {
        /* globals window */
        var nativeSelection =  window.getSelection(),
            params = {},
            element;
        if(nativeSelection.focusNode) {
            if(nativeSelection.isCollapsed && isText(nativeSelection.focusNode)) {
                params = {
                    type: 'caret',
                    element: canvas.getDocumentElement(nativeSelection.focusNode),
                    offset: nativeSelection.focusOffset
                };
            } else if(isText(nativeSelection.focusNode) && isText(nativeSelection.anchorNode)) {
                params = {
                    type: 'textSelection',
                    anchorElement: canvas.getDocumentElement(nativeSelection.anchorNode),
                    anchorOffset: nativeSelection.anchorOffset,
                    focusElement: canvas.getDocumentElement(nativeSelection.focusNode),
                    focusOffset: nativeSelection.focusOffset
                };
            }
        } else if((element = canvas.getCurrentNodeElement())) {
            params = {
                type: 'nodeSelection',
                element: element
            };
        }
        if(params.type) {
            return this.fromParams(canvas, params);
        }
    }
};

});