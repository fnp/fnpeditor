// Module that implements main WYSIWIG edit area

define([
'libs/jquery',
'libs/underscore',
'./canvas/canvas',
'./commands',
'libs/text!./template.html'], function($, _, canvas3, commands, template) {

'use strict';

return function(sandbox) {

    var canvas = canvas3.fromXMLDocument(null, sandbox.publish);
    var canvasWrapper = $(template);
    var shownAlready = false;
    var scrollbarPosition = 0,
        cursorPosition;
    
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
        start: function() { sandbox.publish('ready'); },
        getView: function() {
            return canvasWrapper;
        },
        setDocument: function(wlxmlDocument) {
            canvas.loadWlxmlDocument(wlxmlDocument);
            canvasWrapper.find('#rng-module-documentCanvas-content').empty().append(canvas.view());
        },
        getDocument: function() {
            return canvas.toXML();
        },
        modifyCurrentNodeElement: function(attr, value) {
            var currentNodeElement = canvas.getCurrentNodeElement();
            if(attr === 'class' || attr === 'tag') {
                currentNodeElement['setWlxml'+(attr[0].toUpperCase() + attr.substring(1))](value);
            } else {
                currentNodeElement.setWlxmlMetaAttr(attr, value);
            }
            sandbox.publish('currentNodeElementChanged', currentNodeElement);
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
        command: function(command, params) {
            commands.run(command, params, canvas);
            sandbox.publish('contentChanged');
        }
    };
    
};

});