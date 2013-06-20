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
    

    var view = {

        insertNewNode: function(wlxmlTag, wlxmlClass) {
            //TODO: Insert inline
            var anchor = $(window.getSelection().anchorNode);
            var anchorOffset = window.getSelection().anchorOffset;
            var textLen;
            if(anchor[0].nodeType === Node.TEXT_NODE) {
                textLen = anchor.text().length;
                anchor = anchor.parent();
            }
            if(anchor.text() === '') {
                var todel = anchor;
                anchor = anchor.parent();
                todel.remove();
            }
            if(anchorOffset > 0 && anchorOffset < textLen) {
                if(wlxmlTag === null && wlxmlClass === null) {
                    return this.splitWithNewNode(anchor);
                }
                return this.wrapSelectionWithNewNode(wlxmlTag, wlxmlClass);
            }
            var newNode = this._createNode(wlxmlTag || anchor.attr('wlxml-tag'), wlxmlClass || anchor.attr('wlxml-class'));
            if(anchorOffset === 0)
                anchor.before(newNode)
            else
                anchor.after(newNode);
            this.selectNode(new wlxmlNode.Node(newNode), {movecaret: true});
            //isDirty = true;
            sandbox.publish('contentChanged');
        },
        wrapSelectionWithNewNode: function(wlxmlTag, wlxmlClass) {
            var selection = window.getSelection();
            if(selection.anchorNode === selection.focusNode && selection.anchorNode.nodeType === Node.TEXT_NODE) {
                var startOffset = selection.anchorOffset;
                var endOffset = selection.focusOffset;
                if(startOffset > endOffset) {
                    var tmp = startOffset;
                    startOffset = endOffset;
                    endOffset = tmp;
                }
                var node = selection.anchorNode;
                var prefix = node.data.substr(0, startOffset);
                var suffix = node.data.substr(endOffset);
                var core = node.data.substr(startOffset, endOffset - startOffset);
                var newNode = this._createNode(wlxmlTag, wlxmlClass);
                newNode.text(core || 'test');
                $(node).replaceWith(newNode);
                newNode.before(prefix);
                newNode.after(suffix);
                
                this.selectNode(new wlxmlNode.Node(newNode), {movecaret: true});
                //isDirty = true;
                sandbox.publish('contentChanged');
            }
        },
        splitWithNewNode: function(node) {
            var selection = window.getSelection();
            if(selection.anchorNode === selection.focusNode && selection.anchorNode.nodeType === Node.TEXT_NODE) {
                var startOffset = selection.anchorOffset;
                var endOffset = selection.focusOffset;
                if(startOffset > endOffset) {
                    var tmp = startOffset;
                    startOffset = endOffset;
                    endOffset = tmp;
                }
                var anchor = selection.anchorNode;
                var prefix = anchor.data.substr(0, startOffset);
                var suffix = anchor.data.substr(endOffset);
                var prefixNode = this._createNode(node.attr('wlxml-tag'), node.attr('wlxml-class'));
                var newNode = this._createNode(node.attr('wlxml-tag'), node.attr('wlxml-class'));
                var suffixNode = this._createNode(node.attr('wlxml-tag'), node.attr('wlxml-class'));
                prefixNode.text(prefix);
                suffixNode.text(suffix);
                node.replaceWith(newNode);
                newNode.before(prefixNode);
                newNode.after(suffixNode);
                
                this.selectNode(new wlxmlNode.Node(newNode), {movecaret: true});
                //isDirty = true;
                sandbox.publish('contentChanged');
            }
        }

    };
    

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
        }
    }
    
};

});