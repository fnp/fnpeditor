define([
'libs/jquery',
'modules/documentCanvas/canvas/utils',
], function($, utils) {
    
'use strict';

var Listener = function(canvas) {
    this.canvas = canvas;
};

$.extend(Listener.prototype, {
    listenTo: function(wlxmlDocument) {
        if(wlxmlDocument === this.wlxmlDocument) {
            return;
        }
        this.wlxmlDocument = wlxmlDocument;

        wlxmlDocument.on('change', function(event) {
            var handler = handlers[event.type];
            if(handler) {
                handler.bind(this)(event);
            }
        }, this);

        wlxmlDocument.on('contentSet', function() {
            this.canvas.loadWlxmlDocument(wlxmlDocument);
        }, this);
    }
});

var handlers = {
    nodeAttrChange: function(event) {
        if(event.meta.attr === 'class') {
            var canvasNode = utils.findCanvasElement(event.meta.node);
            canvasNode.setWlxmlClass(event.meta.newVal);
        }
    },
    nodeTagChange: function(event) {
        var canvasNode = utils.findCanvasElement(event.meta.node);
        canvasNode.setWlxmlTag(event.meta.newTagName);
    },
    nodeAdded: function(event) {
        if(event.meta.node.isRoot()) {
            this.canvas.reloadRoot();
            return;
        }
        var parentElement = utils.findCanvasElement(event.meta.node.parent()),
            nodeIndex = event.meta.node.getIndex(),
            referenceElement, referenceAction;

        if(nodeIndex === 0) {
            referenceElement = parentElement;
            referenceAction = 'prepend';
        } else {
            referenceElement = parentElement.children()[nodeIndex-1];
            referenceAction = 'after';
        }

        referenceElement[referenceAction](event.meta.node);
    },
    nodeMoved: function(event) {
        return handlers.nodeAdded(event);
    },
    nodeDetached: function(event) {
        var canvasNode = utils.findCanvasElementInParent(event.meta.node, event.meta.parent);
        canvasNode.detach();
    },
    nodeTextChange: function(event) {
        var canvasElement = utils.findCanvasElement(event.meta.node),
            toSet = event.meta.node.getText();
        if(toSet === '') {
            toSet = utils.unicode.ZWS;
        }
        canvasElement.setText(toSet);
    }
};

return {
    create: function(canvas) {
        return new Listener(canvas);
    }
};

});