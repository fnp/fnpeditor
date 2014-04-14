// Module that implements main WYSIWIG edit area

define([
'libs/jquery',
'libs/underscore',
'./canvas/canvas',
'libs/text!./template.html'], function($, _, canvas3, template) {

'use strict';

return function(sandbox) {

    var canvas = canvas3.fromXMLDocument(null);
    var canvasWrapper = $(template);
    var shownAlready = false;
    var scrollbarPosition = 0,
        actionHandlers = {},
        cursorPosition;
        
    
    canvas.on('selectionChanged', function(selection) {
        sandbox.publish('selectionChanged', selection);
    });

    canvasWrapper.onShow = function() {
        if(!shownAlready) {
            shownAlready = true;
            canvas.setCurrentElement(canvas.doc().getVerticallyFirstTextElement());
        } else {
            canvas.setCursorPosition(cursorPosition);
            this.find('#rng-module-documentCanvas-contentWrapper').scrollTop(scrollbarPosition);
        }
    };
    
    canvasWrapper.onHide = function() {
       scrollbarPosition = this.find('#rng-module-documentCanvas-contentWrapper').scrollTop();
       cursorPosition = canvas.getCursor().getPosition();
    };

    /* public api */
    return {
        start: function() {
            sandbox.getPlugins().forEach(function(plugin) {
                var handlers;
                if(plugin.canvas) {
                    handlers = plugin.canvas.actionHandlers;
                    if(handlers && !_.isArray(handlers)) {
                        handlers = [handlers];
                    }
                    actionHandlers[plugin.name] = handlers;
                }
            });
            sandbox.publish('ready');
        },
        getView: function() {
            return canvasWrapper;
        },
        getCanvas: function() {
            return canvas;
        },
        setDocument: function(wlxmlDocument) {
            canvas.loadWlxmlDocument(wlxmlDocument);
            canvasWrapper.find('#rng-module-documentCanvas-content').empty().append(canvas.view());
        },
        highlightElement: function(node) {
            canvas.toggleElementHighlight(node, true);
        },
        dimElement: function(node) {
            canvas.toggleElementHighlight(node, false);
        },
        jumpToElement: function(node) {
            canvas.setCurrentElement(node);
        },
        onAfterActionExecuted: function(action, ret) {
            (actionHandlers[action.getPluginName()] || []).forEach(function(handler) {
                handler(canvas, action, ret);
            });
        }
    };
    
};

});