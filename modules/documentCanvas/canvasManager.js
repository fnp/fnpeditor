define([
'libs/jquery-1.9.1.min',
'./wlxmlNode'
], function($, wlxmlNode) {

'use strict';

var getCursorPosition = function() {
    var selection = window.getSelection();
    var anchorNode = $(selection.anchorNode);
    var parent = anchorNode.parent();
    return {
        textNode: anchorNode,
        textNodeOffset: selection.anchorOffset,
        textNodeIndex: parent.contents().index(anchorNode),
        parentNode: parent,
        focusNode: $(selection.focusNode).parent(),
        isAtEnd: selection.anchorOffset === anchorNode.text().length
    }
};

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
            manager.onEnterKey(e);
        }
        if(e.which === 8) {
            manager.onBackspaceKey(e);
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
        this.movecaretToNode(nodeElement, options.movecaret);
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

Manager.prototype.movecaretToNode = function(nodeElement, where) {
    var range = document.createRange();
    range.selectNodeContents(nodeElement[0]);
    
    var collapseArg = true;
    if(where === 'end')
        collapseArg = false;
    range.collapse(collapseArg);
    var selection = document.getSelection();
    selection.removeAllRanges()
    selection.addRange(range);
};

Manager.prototype.toggleGrid =  function(toggle) {
    this.canvas.dom.find('[wlxml-tag]').toggleClass('rng-common-hoveredNode', toggle);
    this.gridToggled = toggle;
};

Manager.prototype.onEnterKey = function(e) {
    e.preventDefault();
    var pos = getCursorPosition();
    var insertedNode;
    if(pos.isAtEnd) {
        insertedNode = this.canvas.insertNode({place: 'after', context: {id: pos.parentNode.attr('id')}, tag: pos.parentNode.attr('wlxml-tag'), klass: pos.parentNode.attr('wlxml-class')});
    } else {
        insertedNode = this.canvas.splitNode({node: {id: pos.parentNode.attr('id')}, textNodeIdx: pos.textNodeIndex, offset: pos.textNodeOffset});
    }
    if(insertedNode.length)
        this.selectNode(new wlxmlNode.Node(insertedNode), {movecaret: true});
    this.sandbox.publish('contentChanged');
};

Manager.prototype.onBackspaceKey = function(e) {
    var pos = getCursorPosition();
    var len = pos.textNode.text().length;
    if(len === 1) {
        // Prevent deleting node by browser after last character removed;
        e.preventDefault();
        pos.parentNode.text('');
    }
    if(len === 0) {
        e.preventDefault();
        var toRemove = new wlxmlNode.Node(pos.textNode);
        var prevNode = this.canvas.getPreviousNode({node:toRemove});
        this.canvas.removeNode({node: toRemove}); // jesli nie ma tekstu, to anchor nie jest tex nodem
        this.selectNode(prevNode, {movecaret: 'end'});
    }
}

Manager.prototype.command = function(command, meta) {
    var pos = getCursorPosition();
    
    if(command === 'createList') {
        var node = new wlxmlNode.Node(pos.parentNode);
        if(window.getSelection().getRangeAt().collapsed && this.canvas.insideList({pointer: node})) {
            this.canvas.removeList({pointer: node});
            this.selectNode(node, {movecaret: 'end'});
            this.sandbox.publish('contentChanged');
        }
        else {
            if(!this.canvas.insideList({pointer: node})) {
                this.canvas.createList({start: new wlxmlNode.Node(pos.parentNode), end: new wlxmlNode.Node(pos.focusNode)});
                this.selectNode(new wlxmlNode.Node(pos.parentNode), {movecaret: 'end'});
                this.sandbox.publish('contentChanged');
            }
        }
    }

}


return Manager;
    
});