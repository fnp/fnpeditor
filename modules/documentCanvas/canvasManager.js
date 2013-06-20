define([
'libs/jquery-1.9.1.min',
'./wlxmlNode'
], function($, wlxmlNode) {

'use strict';

var Manager = function(canvas, sandbox) {
    this.canvas = canvas;
    this.sandbox = sandbox;
    this.shownAlready = false;
    this.gridToggled = false;
    this.scrollbarPosition = 0;
    this.currentNode = null;
    var manager = this;
        
    canvas.dom.find('#rng-module-documentCanvas-content').on('keyup', function() {
        manager.sandbox.publish('contentChanged');
    });

    canvas.dom.on('mouseover', '[wlxml-tag]', function(e) {
        e.stopPropagation();
        manager.sandbox.publish('nodeHovered', new wlxmlNode.Node($(e.target)));
    });
    canvas.dom.on('mouseout', '[wlxml-tag]', function(e) {
        e.stopPropagation();
        manager.sandbox.publish('nodeBlured', new wlxmlNode.Node($(e.target)));
    });
    canvas.dom.on('click', '[wlxml-tag]', function(e) {
        e.stopPropagation();
        console.log('clicked node type: '+e.target.nodeType);
        manager.selectNode(new wlxmlNode.Node($(e.target)));
    });

    canvas.dom.on('keyup', '#rng-module-documentCanvas-contentWrapper', function(e) {
        var anchor = $(window.getSelection().anchorNode);
        if(anchor[0].nodeType === Node.TEXT_NODE)
            anchor = anchor.parent();
        if(!anchor.is('[wlxml-tag]'))
            return;
        manager.selectNode(new wlxmlNode.Node(anchor));
    });
    
    canvas.dom.on('keydown', '#rng-module-documentCanvas-contentWrapper', function(e) {
        if(e.which === 13) { 
            e.preventDefault();
            manager.insertNewNode(null, null);
        }
        if(e.which === 8) {
            var anchor = window.getSelection().anchorNode;
            var len = anchor.length;
            console.log(len);
            if(len === 1) {
                e.preventDefault();
                $(anchor).parent().text('');
            }
        }
    });
              
    canvas.dom.onShow = function() {
        if(!manager.shownAlready) {
            manager.shownAlready = true;
            manager.selectFirstNode();
        } else if(manager.currentNode) {
            manager.movecaretToNode(manager.getNodeElement(manager.currentNode));
            canvas.dom.find('#rng-module-documentCanvas-contentWrapper').scrollTop(manager.scrollbarPosition);
        }
    };
    canvas.dom.onHide = function() {
       manager.scrollbarPosition = canvas.dom.find('#rng-module-documentCanvas-contentWrapper').scrollTop();
    }
};
    
Manager.prototype.selectNode = function(wlxmlNode, options) {
    options = options || {};
    var nodeElement = this.getNodeElement(wlxmlNode)
    
    this.dimNode(wlxmlNode);
    
    this.canvas.dom.find('.rng-module-documentCanvas-currentNode').removeClass('rng-module-documentCanvas-currentNode');
    nodeElement.addClass('rng-module-documentCanvas-currentNode');
    
    if(options.movecaret) {
        this.movecaretToNode(nodeElement);
    }
    
    this.currentNode = wlxmlNode;
    this.sandbox.publish('nodeSelected', wlxmlNode);
};

Manager.prototype.getNodeElement = function(wlxmlNode) {
    return this.canvas.dom.find('#'+wlxmlNode.id);
};

Manager.prototype.highlightNode = function(wlxmlNode) {
    var nodeElement = this.getNodeElement(wlxmlNode);
    if(!this.gridToggled) {
        nodeElement.addClass('rng-common-hoveredNode');
        var label = nodeElement.attr('wlxml-tag');
        if(nodeElement.attr('wlxml-class'))
            label += ' / ' + nodeElement.attr('wlxml-class');
        var tag = $('<div>').addClass('rng-module-documentCanvas-hoveredNodeTag').text(label);
        nodeElement.append(tag);
    }
};

Manager.prototype.dimNode = function(wlxmlNode) {
    var nodeElement = this.getNodeElement(wlxmlNode);
    if(!this.gridToggled) {
        nodeElement.removeClass('rng-common-hoveredNode');
        nodeElement.find('.rng-module-documentCanvas-hoveredNodeTag').remove();
    }
};

Manager.prototype.selectFirstNode = function() {
    var firstNodeWithText = this.canvas.dom.find('[wlxml-tag]').filter(function() {
        return $(this).clone().children().remove().end().text().trim() !== '';
    }).first();
    var node;
    if(firstNodeWithText.length)
        node = $(firstNodeWithText[0])
    else {
        node = this.canvas.dom.find('[wlxml-class|="p"]')
    }
    this.selectNode(new wlxmlNode.Node(node), {movecaret: true});
};

Manager.prototype.movecaretToNode = function(nodeElement) {
    var range = document.createRange();
    range.selectNodeContents(nodeElement[0]);
    range.collapse(true);
    var selection = document.getSelection();
    selection.removeAllRanges()
    selection.addRange(range);
};

Manager.prototype.toggleGrid =  function(toggle) {
    this.canvas.dom.find('[wlxml-tag]').toggleClass('rng-common-hoveredNode', toggle);
    this.gridToggled = toggle;
};

Manager.prototype.insertNewNode = function(wlxmlTag, wlxmlClass) {
    //TODO: Insert inline
    var anchor = $(window.getSelection().anchorNode);
    var anchorOffset = window.getSelection().anchorOffset;
    
    var parent = anchor.parent();
    var idx = parent.contents().index(anchor);
    
    if(anchorOffset < anchor.text().length) {
        var newNode = this.canvas.splitNode({node: {id: parent.attr('id')}, textNodeIdx: idx, offset: anchorOffset});
        this.selectNode(new wlxmlNode.Node(newNode), {movecaret: true});
    }

    
    
    this.sandbox.publish('contentChanged');
};

return Manager;
    
});