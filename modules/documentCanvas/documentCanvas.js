// Module that implements main WYSIWIG edit area

define([
'libs/underscore-min',
'./transformations', 
'./canvas',
'./canvasManager',
'libs/text!./template.html'], function(_, transformations, Canvas, CanvasManager, template) {

'use strict';

return function(sandbox) {

    var canvas = Canvas.create();
    var manager = new CanvasManager(canvas, sandbox);

    /* public api */
    return {
        start: function() { sandbox.publish('ready'); },
        getView: function() { 
            return canvas.dom;
        },
        setDocument: function(xml) {
            canvas.setHTML(transformations.fromXML.getHTMLTree(xml));
            sandbox.publish('documentSet');
        },
        getDocument: function() {
            return transformations.toXML.getXML(canvas.getContent());
        },
        modifyCurrentNode: function(attr, value) {
            if(manager.currentNode) {
                if(_.contains(['tag', 'class'], attr)) {
                    manager.getNodeElement(manager.currentNode).attr('wlxml-'+attr, value);
                } else {
                    // changing node meta attr
                    manager.currentNode.setMetaAttr(attr, value);
                }
                sandbox.publish('contentChanged');
                sandbox.publish('currentNodeChanged', manager.currentNode);
            }
        },
        highlightNode: function(canvasNode) {
            manager.highlightNode(canvasNode);
        },
        dimNode: function(canvasNode) {
            manager.dimNode(canvasNode);
        },
        selectNode: function(canvasNode) {
            if(!canvasNode.isSame(manager.currentNode))
                manager.selectNode(canvasNode, {movecaret: true});
        },
        toggleGrid: function(toggle) {
            manager.toggleGrid(toggle);
        },
        insertNewNode: function(wlxmlTag, wlxmlClass) {
            manager.insertNewNode(wlxmlTag, wlxmlClass);
        },
        command: function(command, meta) {
            manager.command(command, meta);
        }
    };
    
};

});