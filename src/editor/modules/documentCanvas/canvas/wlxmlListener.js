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

        wlxmlDocument.on('operationEnd', function() {
            this.canvas.triggerSelectionChanged();
        }, this);

        wlxmlDocument.on('contentSet', function() {
            this.canvas.loadWlxmlDocument(wlxmlDocument);
        }, this);
    }
});


var _metadataEventHandler = function(event) {
    var element = utils.getElementForNode(event.meta.node);
    element.handle(event);
};


var handlers = {
    nodeAttrChange: function(event) {
        var element = utils.getElementForNode(event.meta.node),
            newElement;
        if(event.meta.attr === 'class') {
            if(element.wlxmlNode.getClass() !== event.meta.attr) {
                if(event.meta.node.isRoot()) {
                    this.canvas.reloadRoot();
                } else {
                    newElement = this.canvas.createElement(event.meta.node);
                    element.dom().replaceWith(newElement.dom());
                }
            }

        } else {
            element.handle(event);
        }
    },
    nodeAdded: function(event) {
        if(event.meta.node.isRoot()) {
            this.canvas.reloadRoot();
            return;
        }

        var containingNode = event.meta.node.parent(),
            containingElement = utils.getElementForNode(containingNode);

        containingElement.handle(event);
    },
    nodeMoved: function(event) {
        return handlers.nodeAdded.call(this, event, true); //
        //
    },
    nodeDetached: function(event) {
        var element = utils.getElementForDetachedNode(event.meta.node, event.meta.parent);
        element.handle(event);
    },
    nodeTextChange: function(event) {
        var element = utils.getElementForNode(event.meta.node.parent());
        element.handle(event);
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