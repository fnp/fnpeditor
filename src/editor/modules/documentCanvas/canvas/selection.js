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
    },
    isAtEdge: function() {
        return this.isAtBeginning() || this.isAtEnd();
    },
    isAtBeginning: function() {
        return this.offset === 0;
    },
    isAtEnd: function() {
        return this.offset === this.element.getText().length;
    }
});

var TextSelection = function(canvas, params) {
    var anchorFirst;

    Selection.call(this, canvas, params);

    if(this.anchorElement.sameNode(this.focusElement)) {
        anchorFirst = this.anchorOffset <= this.focusOffset;
    } else {
        /*jshint bitwise: false*/
        /* globals Node */
        anchorFirst = this.anchorElement.dom[0].compareDocumentPosition(this.focusElement.dom[0]) & Node.DOCUMENT_POSITION_FOLLOWING;
    }

    if(anchorFirst) {
        this.startElement = this.anchorElement;
        this.startOffset = this.anchorOffset;
        this.endElement = this.focusElement;
        this.endOffset = this.focusOffset;

    } else {
        this.startElement = this.focusElement;
        this.startOffset = this.focusOffset;
        this.endElement = this.anchorElement;
        this.endOffset = this.anchorOffset;
    }
};
TextSelection.prototype = Object.create(Selection.prototype);
$.extend(TextSelection.prototype, {
    toDocumentFragment: function() {
        var doc = this.canvas.wlxmlDocument,
            anchorNode = this.anchorElement ? this.anchorElement.wlxmlNode : null,
            focusNode = this.focusElement ? this.focusElement.wlxmlNode : null,
            node1, node2;
        
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
            if(anchorNode.hasSameContextRoot(focusNode)) {
                var siblingParents = doc.getSiblingParents({node1: anchorNode, node2: focusNode});
                node1 = siblingParents.node1;
                node2 = siblingParents.node2;
            } else {
                node1 = focusNode;
                node2 = anchorNode;
            }
            return doc.createFragment(doc.RangeFragment, {
                node1: node1,
                node2: node2
            });
        }
    },
    startsAtBeginning: function() {
        return this.startOffset === 0;
    },
    endsAtEnd: function() {
        return this.endOffset === this.endElement.getText().length;
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
            element, anchorElement, focusElement;
            
        if(nativeSelection.focusNode) {
            if(nativeSelection.isCollapsed && isText(nativeSelection.focusNode)) {
                element = canvas.getDocumentElement(nativeSelection.focusNode);
                params = {
                    type: 'caret',
                    element: element,
                    offset: element.isEmpty() ? 0 : nativeSelection.getRangeAt(0).startOffset
                };
            } else if(isText(nativeSelection.focusNode) && isText(nativeSelection.anchorNode)) {
                anchorElement = canvas.getDocumentElement(nativeSelection.anchorNode);
                focusElement = canvas.getDocumentElement(nativeSelection.focusNode);
                params = {
                    type: 'textSelection',
                    anchorElement: anchorElement,
                    anchorOffset: anchorElement.isEmpty() ? 0 : nativeSelection.anchorOffset,
                    focusElement: focusElement,
                    focusOffset: focusElement.isEmpty() ? 0 : nativeSelection.focusOffset
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