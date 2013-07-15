// Module that implements main WYSIWIG edit area

define([
'libs/underscore-min',
'./transformations', 
'./canvas',
'./canvasManager',
'./canvas/canvas',
'libs/text!./template.html'], function(_, transformations, Canvas, CanvasManager, canvas3, template) {

'use strict';

return function(sandbox) {

    var canvas = canvas3.fromXML('', sandbox.publish); //canvasCanvas.create();
    var manager;
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
        setDocument: function(xml) {
            canvas.loadWlxml(xml); //canvas.setHTML(transformations.fromXML.getHTMLTree(xml));
            canvasWrapper.find('#rng-module-documentCanvas-content').empty().append(canvas.view());
            manager = new CanvasManager(canvas, sandbox);
            sandbox.publish('documentSet');
        },
        getDocument: function() {
            return transformations.toXML.getXML(canvas.getContent());
        },
        modifyCurrentNodeElement: function(attr, value) {
            if(attr === 'class' || attr === 'tag') {
                canvas.getCurrentNodeElement()['setWlxml'+(attr[0].toUpperCase() + attr.substring(1))](value);    
            }
        },
        highlightElement: function(element) {
            canvas.highlightElement(element);
        },
        dimElement: function(element) {
            canvas.dimElement(element);
        },
        jumpToElement: function(element) {
            canvas.setCurrentElement(element);
        },
        command: function(command, params) {
            manager.command(command, params);
        }
    };
    
};

});