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

    var canvas = canvas3.fromXML(''); //canvasCanvas.create();
    var manager;
    var canvasWrapper = $(template);

    /* public api */
    return {
        start: function() { sandbox.publish('ready'); },
        getView: function() { 
            return canvasWrapper;
        },
        setDocument: function(xml) {
            canvas.loadWlxml(xml); //canvas.setHTML(transformations.fromXML.getHTMLTree(xml));
            canvasWrapper.find('#rng-module-documentCanvas-content').empty().append(canvas.doc().dom());
            manager = new CanvasManager(canvas, sandbox);
            sandbox.publish('documentSet');
        },
        getDocument: function() {
            return transformations.toXML.getXML(canvas.getContent());
        },
        modifyCurrentNode: function(attr, value) {
            if(manager.currentNode) {
                if(attr === 'tag') {
                    manager.getNodeElement(manager.currentNode).attr('wlxml-'+attr, value);
                }
                else if(attr === 'class') {
                    manager.currentNode.setClass(value);
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