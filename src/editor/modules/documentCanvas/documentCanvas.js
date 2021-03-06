// Module that implements main WYSIWIG edit area

define([
'libs/jquery',
'libs/underscore',
'fnpjs/logging/logging',
'./canvas/canvas',
'libs/text!./template.html'], function($, _, logging, canvas3, template) {

'use strict';


var logger = logging.getLogger('documentCanvas');

return function(sandbox) {

    var canvasElements = [];

    sandbox.getPlugins().forEach(function(plugin) {
        canvasElements = canvasElements.concat(plugin.canvasElements || []);
    });

    var canvas = canvas3.fromXMLDocument(null, canvasElements, {
        user: sandbox.getConfig().user
    }, sandbox);
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
            canvasWrapper.find('#rng-module-documentCanvas-contentWrapper').empty().append(canvas.view());
        },
        onAfterActionExecuted: function(action, ret) {
            if(ret && ret.isValid && ret.isValid()) {
                logger.debug('The action returned a valid fragment');
                return canvas.select(ret);
            }

            logger.debug('No valid fragment returned from the action');

            (actionHandlers[action.getPluginName()] || []).forEach(function(handler) {
                handler(canvas, action, ret);
            });
        }
    };
    
};

});