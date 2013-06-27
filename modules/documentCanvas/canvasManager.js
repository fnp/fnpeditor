define([
'libs/jquery-1.9.1.min',
'./canvasNode'
], function($, canvasNode) {

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
        manager.sandbox.publish('nodeHovered', canvasNode.create($(e.target)));
    });
    canvas.dom.on('mouseout', '[wlxml-tag]', function(e) {
        e.stopPropagation();
        manager.sandbox.publish('nodeBlured', canvasNode.create($(e.target)));
    });
    canvas.dom.on('click', '[wlxml-tag]', function(e) {
        e.stopPropagation();
        console.log('clicked node type: '+e.target.nodeType);
        manager.selectNode(canvasNode.create($(e.target)));
    });

    canvas.dom.on('keyup', '#rng-module-documentCanvas-contentWrapper', function(e) {
        var anchor = $(window.getSelection().anchorNode);
        
        if(anchor[0].nodeType === Node.TEXT_NODE)
            anchor = anchor.parent();
        if(!anchor.is('[wlxml-tag]'))
            return;
        manager.selectNode(canvasNode.create(anchor));
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
    
Manager.prototype.selectNode = function(cnode, options) {
    options = options || {};
    var nodeElement = this.getNodeElement(cnode)
    
    this.dimNode(cnode);
    
    this.canvas.dom.find('.rng-module-documentCanvas-currentNode').removeClass('rng-module-documentCanvas-currentNode');
    nodeElement.addClass('rng-module-documentCanvas-currentNode');
    
    if(options.movecaret) {
        this.movecaretToNode(nodeElement, options.movecaret);
    }
    
    this.currentNode = cnode;
    this.sandbox.publish('nodeSelected', cnode);
};

Manager.prototype.insertNewNode = function(wlxmlTag, wlxmlClass) {
    var selection = window.getSelection();

    if(selection.getRangeAt(0).collapsed) {
    
    } else {
        var offsetStart = selection.anchorOffset;
        var offsetEnd = selection.focusOffset;
        if(offsetStart > offsetEnd) {
            var tmp = offsetStart;
            offsetStart = offsetEnd;
            offsetEnd = tmp;
        }
        var wrapper = canvasNode.create({tag: wlxmlTag, klass: wlxmlClass});
        this.canvas.nodeWrap({inside: canvasNode.create($(selection.anchorNode).parent()),
                              _with: wrapper,
                              offsetStart: offsetStart,
                              offsetEnd: offsetEnd
                            });
        this.selectNode(wrapper, {movecaret: 'end'});
    }
    
    
}

Manager.prototype.getNodeElement = function(cnode) {
    return this.canvas.dom.find('#'+cnode.getId());
};

Manager.prototype.highlightNode = function(cnode) {
    var nodeElement = this.getNodeElement(cnode);
    if(!this.gridToggled) {
        nodeElement.addClass('rng-common-hoveredNode');
        var label = nodeElement.attr('wlxml-tag');
        if(nodeElement.attr('wlxml-class'))
            label += ' / ' + nodeElement.attr('wlxml-class');
        var tag = $('<div>').addClass('rng-module-documentCanvas-hoveredNodeTag').text(label);
        nodeElement.append(tag);
    }
};

Manager.prototype.dimNode = function(cnode) {
    var nodeElement = this.getNodeElement(cnode);
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
    this.selectNode(canvasNode.create(node), {movecaret: true});
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
    var contextNode = this.canvas.getNodeById(pos.parentNode.attr('id'));
    var newNode;

    if(pos.isAtEnd) {
        newNode = canvasNode.create({tag: pos.parentNode.attr('wlxml-tag'), klass: pos.parentNode.attr('wlxml-class')});
        this.canvas.nodeInsertAfter({node: newNode, after: canvas.getNodeById(pos.parentNode.attr('id'))});
    } else {
        newNode = this.canvas.nodeSplit({node: contextNode, textNodeIdx: pos.textNodeIndex, offset: pos.textNodeOffset});
    }
    if(newNode)
        this.selectNode(newNode, {movecaret: true});
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
        var toRemove = canvasNode.create(pos.textNode);
        var prevNode = this.canvas.getPrecedingNode({node:toRemove});
        this.canvas.nodeRemove({node: toRemove}); // jesli nie ma tekstu, to anchor nie jest tex nodem
        this.selectNode(prevNode, {movecaret: 'end'});
    }
}

Manager.prototype.command = function(command, meta) {
    var pos = getCursorPosition();
    
    if(command === 'createList') {
        var node = canvasNode.create(pos.parentNode);
        if(window.getSelection().getRangeAt().collapsed && this.canvas.nodeInsideList({node: node})) {
            this.canvas.listRemove({pointer: node});
            this.selectNode(node, {movecaret: 'end'});
            this.sandbox.publish('contentChanged');
        }
        else {
            if(!this.canvas.nodeInsideList({node: node})) {
                this.canvas.listCreate({start: node, end: canvasNode.create(pos.focusNode)});
                this.selectNode(node, {movecaret: 'end'});
                this.sandbox.publish('contentChanged');
            }
        }
    }

}


return Manager;
    
});