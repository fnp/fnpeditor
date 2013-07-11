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
    };
};

var Manager = function(canvas, sandbox) {
    this.canvas = canvas;
    this.sandbox = sandbox;
    this.shownAlready = false;
    this.gridToggled = false;
    this.scrollbarPosition = 0;
    this.currentNode = null;
    var manager = this;
        
    canvas.doc().dom().find('#rng-module-documentCanvas-content').on('keyup', function() {
        manager.sandbox.publish('contentChanged');
    });

    canvas.doc().dom().on('mouseover', '[wlxml-tag]', function(e) {
        e.stopPropagation();
        manager.sandbox.publish('nodeHovered', canvasNode.create($(e.target)));
    });
    canvas.doc().dom().on('mouseout', '[wlxml-tag]', function(e) {
        e.stopPropagation();
        manager.sandbox.publish('nodeBlured', canvasNode.create($(e.target)));
    });
    canvas.doc().dom().on('click', '[wlxml-tag]', function(e) {
        e.stopPropagation();
        console.log('clicked node type: '+e.target.nodeType);
        manager.selectNode(canvasNode.create($(e.target)));
    });

    canvas.doc().dom().on('keyup', '#rng-module-documentCanvas-contentWrapper', function(e) {
        var anchor = $(window.getSelection().anchorNode);
        
        if(anchor[0].nodeType === Node.TEXT_NODE)
            anchor = anchor.parent();
        if(!anchor.is('[wlxml-tag]'))
            return;
        manager.selectNode(canvasNode.create(anchor));
    });
    
    canvas.doc().dom().on('keydown', '#rng-module-documentCanvas-contentWrapper', function(e) {
        if(e.which === 13) { 
            manager.onEnterKey(e);
        }
        if(e.which === 8) {
            manager.onBackspaceKey(e);
        }
    });
              
    canvas.doc().dom().onShow = function() {
        if(!manager.shownAlready) {
            manager.shownAlready = true;
            manager.selectFirstNode();
        } else if(manager.currentNode) {
            manager.movecaretToNode(manager.getNodeElement(manager.currentNode));
            canvas.doc().dom().find('#rng-module-documentCanvas-contentWrapper').scrollTop(manager.scrollbarPosition);
        }
    };
    canvas.doc().dom().onHide = function() {
       manager.scrollbarPosition = canvas.doc().dom().find('#rng-module-documentCanvas-contentWrapper').scrollTop();
    };
};
    
Manager.prototype.selectNode = function(cnode, options) {
    options = options || {};
    var nodeElement = this.getNodeElement(cnode);
    
    this.dimNode(cnode);
    
    this.canvas.doc().dom().find('.rng-module-documentCanvas-currentNode').removeClass('rng-module-documentCanvas-currentNode');
    nodeElement.addClass('rng-module-documentCanvas-currentNode');
    
    if(options.movecaret) {
        this.movecaretToNode(nodeElement, options.movecaret);
    }
    
    this.currentNode = cnode;
    this.sandbox.publish('nodeSelected', cnode);
};

Manager.prototype.getNodeElement = function(cnode) {
    return this.canvas.doc().dom().find('#'+cnode.getId());
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
    var firstNodeWithText = this.canvas.doc().dom().find('[wlxml-tag]').filter(function() {
        return $(this).clone().children().remove().end().text().trim() !== '';
    }).first();
    var node;
    if(firstNodeWithText.length)
        node = $(firstNodeWithText[0]);
    else {
        node = this.canvas.doc().dom().find('[wlxml-class|="p"]');
    }
    this.selectNode(canvasNode.create(node), {movecaret: true});
};

Manager.prototype.movecaretToNode = function(nodeElement, where) {
    if(!nodeElement.length)
        return;
    var range = document.createRange();
    range.selectNodeContents(nodeElement[0]);
    
    var collapseArg = true;
    if(where === 'end')
        collapseArg = false;
    range.collapse(collapseArg);
    var selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
};

Manager.prototype.onEnterKey = function(e) {
    e.preventDefault();
    var pos = getCursorPosition();
    var contextNode = this.canvas.getNodeById(pos.parentNode.attr('id'));
    var newNode;

    if(pos.isAtEnd) {
        newNode = canvasNode.create({tag: pos.parentNode.attr('wlxml-tag'), klass: pos.parentNode.attr('wlxml-class')});
        this.canvas.nodeInsertAfter({node: newNode, after: this.canvas.getNodeById(pos.parentNode.attr('id'))});
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
};

Manager.prototype.toggleList = function(toggle) {
    var selection  = window.getSelection(),
        node1 = $(selection.anchorNode).parent()[0],
        node2 = $(selection.focusNode).parent()[0],
        element1 = this.canvas.getDocumentElement(node1),
        element2 = this.canvas.getDocumentElement(node2);

};

Manager.prototype.command = function(command, params) {
    var selection  = window.getSelection(),
        element1 = this.canvas.getDocumentElement(selection.anchorNode),
        element2 = this.canvas.getDocumentElement(selection.focusNode);

    if(command === 'unwrap-node') {
        // this.canvas.nodeUnwrap({node: canvasNode.create(pos.parentNode)});
        // this.sandbox.publish('contentChanged');
        element1 = element1.parent();
        element2 = element2.parent();
        if(this.canvas.list.areItemsOfTheSameList({element1: element1, element2: element2})) {
            this.canvas.list.extractItems({element1: element1, element2: element2});
        }
    } else if(command === 'wrap-node') {
        element1 = element1.parent();
        element2 = element2.parent();
        if(this.canvas.list.areItemsOfTheSameList({element1: element1, element2: element2})) {
            this.canvas.list.create({element1: element1, element2: element2});
        }
    } else if(command === 'toggle-list') {
        element1 = element1.parent();
        element2 = element2.parent();
        if(params.toggle) {
            this.canvas.list.create({element1: element1, element2: element2});
        } else {
            if(this.canvas.list.areItemsOfTheSameList({element1: element1, element2: element2})) {
                this.canvas.list.extractItems({element1: element1, element2: element2, merge: false});
            } 
        }
    } else if(command == 'toggle-grid') {
        this.canvas.doc().dom().find('[wlxml-tag]').toggleClass('rng-common-hoveredNode', params.toggle);
        this.gridToggled = params.toggle;
    } else if(command == 'newNodeRequested') {
        if(!selection.isCollapsed && element1.parent().sameNode(element2.parent())) {
            var parent = element1.parent(),
                offsetStart = selection.anchorOffset,
                offsetEnd = selection.focusOffset;

            if(element1.sameNode(element2)) {
                element1.wrapWithNodeElement({tag: params.wlxmlTag, klass: params.wlxmlClass, start: offsetStart, end: offsetEnd});
            }
            else {
                if(parent.childIndex(element1) > parent.childIndex(element2)) {
                    var tmp = offsetStart;
                    offsetStart = offsetEnd;
                    offsetEnd = tmp;
                }
                this.canvas.wrapText({
                    inside: parent,
                    _with: {tag: params.wlxmlTag, klass: params.wlxmlClass},
                    offsetStart: offsetStart,
                    offsetEnd: offsetEnd,
                    textNodeIdx: [parent.childIndex(element1), parent.childIndex(element2)]
                });
            }
        }
    }
};


return Manager;
    
});