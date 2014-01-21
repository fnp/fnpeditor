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


var _metadataEventHandler = function(event) {
    var canvasNode = utils.findCanvasElement(event.meta.node);
    canvasNode.exec('updateMetadata');
};

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
        canvasNode.data('wlxmlNode', event.meta.node);
    },
    nodeAdded: function(event, checkForExistence) {
        if(event.meta.node.isRoot()) {
            this.canvas.reloadRoot();
            return;
        }
        var parentElement = utils.findCanvasElement(event.meta.node.parent()),
            nodeIndex = event.meta.node.getIndex(),
            referenceElement, referenceAction, actionArg;

        if(nodeIndex === 0) {
            referenceElement = parentElement;
            referenceAction = 'prepend';
        } else {
            referenceElement = parentElement.children()[nodeIndex-1];
            referenceAction = 'after';
        }

        actionArg = (checkForExistence && utils.findCanvasElement(event.meta.node)) || event.meta.node;
        referenceElement[referenceAction](actionArg);
    },
    nodeMoved: function(event) {
        return handlers.nodeAdded(event, true);
    },
    nodeDetached: function(event) {
        var canvasNode = utils.findCanvasElementInParent(event.meta.node, event.meta.parent);
        canvasNode.detach();
    },
    nodeTextChange: function(event) {
        //console.log('wlxmlListener: ' + event.meta.node.getText());
        var canvasElement = utils.findCanvasElement(event.meta.node),
            toSet = event.meta.node.getText();
        if(toSet === '') {
            toSet = utils.unicode.ZWS;
        }
        if(toSet !== canvasElement.getText()) {
            canvasElement.setText(toSet);
        }
    },

    metadataChanged: _metadataEventHandler,
    metadataAdded: _metadataEventHandler,
    metadataRemoved: _metadataEventHandler
};

return {
    create: function(canvas) {
        return new Listener(canvas);
    }
};

});