// Module that implements main WYSIWIG edit area

define([
'libs/underscore-min',
'./transformations', 
'./wlxmlNode',
'./canvas',
'./canvasManager',
'libs/text!./template.html'], function(_, transformations, wlxmlNode, Canvas, CanvasManager, template) {

'use strict';

return function(sandbox) {

    var canvas = new Canvas.Canvas();
    var manager = new CanvasManager(canvas, sandbox);

    /* public api */
    return {
        start: function() { sandbox.publish('ready'); },
        getView: function() { 
            return canvas.dom;
        },
        setDocument: function(xml) {
            canvas.setXML(xml);
            sandbox.publish('documentSet');
        },
        getDocument: function() {
            return canvas.toXML();
        },
        modifyCurrentNode: function(attr, value) {
            if(manager.currentNode) {
                manager.getNodeElement(manager.currentNode).attr('wlxml-'+attr, value);
                sandbox.publish('contentChanged');
            }
        },
        highlightNode: function(wlxmlNode) {
            manager.highlightNode(wlxmlNode);
        },
        dimNode: function(wlxmlNode) {
            manager.dimNode(wlxmlNode);
        },
        selectNode: function(wlxmlNode) {
            if(!wlxmlNode.is(manager.currentNode))
                manager.selectNode(wlxmlNode, {movecaret: true});
        },
        toggleGrid: function(toggle) {
            manager.toggleGrid(toggle);
        },
        insertNewNode: function(wlxmlTag, wlxmlClass) {
            manager.insertNewNode(wlxmlTag, wlxmlClass);
        },
        wrapSelectionWithNewNode: function(wlxmlTag, wlxmlClass) {
            manager.wrapSelectionWithNewNode(wlxmlTag, wlxmlClass);
        },
        command: function(command, meta) {
            manager.command(command, meta);
        }
    }
    
};

});