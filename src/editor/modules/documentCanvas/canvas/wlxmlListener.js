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

        wlxmlDocument.on('change', function(event) {
            var handler = handlers[event.type];
            if(handler) {
                handler.bind(this)(event);
            }
        }, this);
    }
});

var handlers = {
    nodeAttrChange: function(event) {
        if(event.meta.attr === 'class') {
            var canvasNode = utils.findCanvasElement(event.meta.node);
            canvasNode.setWlxmlClass(event.meta.newVal);
        }
    }
};

return {
    create: function(canvas) {
        return new Listener(canvas);
    }
};

});