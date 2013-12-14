define([
'modules/documentCanvas/canvas/documentElement',
'./canvas/utils'
], function(documentElement, utils) {
    
'use strict';


var gridToggled = false;

var commands = {
    _cmds: {},
    register: function(name, command) {
        this._cmds[name] = command;
    },

    run: function(name, params, canvas) {
        return this._cmds[name](canvas, params);
    }
};

commands.register('undo', function(canvas) {
    var doc = canvas.wlxmlDocument;

    doc.undo();
});

commands.register('redo', function(canvas) {
    var doc = canvas.wlxmlDocument;

    doc.redo();
});

commands.register('remove-node', function(canvas) {
    canvas.getCurrentNodeElement().data('wlxmlNode').detach();
});

commands.register('unwrap-node', function(canvas) {
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd(),
        parent1 = selectionStart.element.parent() || undefined,
        parent2 = selectionEnd.element.parent() || undefined;

    var selectionAnchor = cursor.getSelectionAnchor(),
        node1 = parent1.data('wlxmlNode'),
        node2 = parent2.data('wlxmlNode'),
        doc = node1.document;
    if(doc.areItemsOfSameList({node1: node1, node2: node2})) {


        doc.extractItems({item1: node1, item2: node2});

        //canvas.list.extractItems({element1: parent1, element2: parent2});
        canvas.setCurrentElement(selectionAnchor.element, {caretTo: selectionAnchor.offset});
    } else if(!cursor.isSelecting()) {
        var nodeToUnwrap = cursor.getPosition().element.data('wlxmlNode'),
            parentNode = nodeToUnwrap.unwrap();
        if(parentNode) {
            canvas.setCurrentElement(utils.findCanvasElement(parentNode));
        }
    }
});

commands.register('wrap-node', function(canvas) {
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd(),
        parent1 = selectionStart.element.parent() || undefined,
        parent2 = selectionEnd.element.parent() || undefined;

    var node1 = parent1.data('wlxmlNode'),
        node2 = parent2.data('wlxmlNode'),
        doc = node1.document;

    if(doc.areItemsOfSameList({node1: node1, node2: node2})) {
        //canvas.list.create({element1: parent1, element2: parent2});
        //doc.transform('createList', {node1: node1, node2: node2});
        doc.createList({node1: node1, node2: node2});
    }
});

commands.register('list', function(canvas, params) {
    void(params);
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd(),
        parent1 = selectionStart.element.parent() || undefined,
        parent2 = selectionEnd.element.parent() || undefined;

    var selectionFocus = cursor.getSelectionFocus();

    if(selectionStart.element.isInsideList() || selectionEnd.element.isInsideList()) {
        return;
    }

    var node1 = parent1.data('wlxmlNode'),
        node2 = parent2.data('wlxmlNode'),
        doc = node1.document;
    
    //doc.transform('createList', {node1: node1, node2: node2});
    doc.createList({node1: node1, node2: node2});


    canvas.setCurrentElement(selectionFocus.element, {caretTo: selectionFocus.offset});
});

commands.register('toggle-grid', function(canvas, params) {
    canvas.doc().dom().find('[wlxml-tag]').toggleClass('rng-common-hoveredNode', params.toggle);
    gridToggled = params.toggle;
});

commands.register('newNodeRequested', function(canvas, params) {
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd(),
        wlxmlNode, caretTo, wrapper, wrapperCanvasElement;

    if(cursor.isSelecting()) {
        if(cursor.isSelectingSiblings()) {
            if(cursor.isSelectingWithinElement()) {
                wlxmlNode = selectionStart.element.data('wlxmlNode');
                caretTo = selectionStart.offset < selectionEnd.offset ? 'start' : 'end';
                    //wrapper = wlxmlNode.wrapWith({tagName: params.wlxmlTag, attrs: {'class': params.wlxmlClass}, start: selectionStart.offset, end: selectionEnd.offset}),
                    //wrapper = wlxmlNode.transform('smartxml.wrapWith', {tagName: params.wlxmlTag, attrs: {'class': params.wlxmlClass}, start: selectionStart.offset, end: selectionEnd.offset})
                wrapper = wlxmlNode.wrapWith({tagName: params.wlxmlTag, attrs: {'class': params.wlxmlClass}, start: selectionStart.offset, end: selectionEnd.offset});
                wrapperCanvasElement = utils.findCanvasElement(wrapper);
                canvas.setCurrentElement(wrapperCanvasElement.children()[0], {caretTo: caretTo});
            }
            else {
                wlxmlNode = selectionStart.element.data('wlxmlNode').parent();
                caretTo = selectionStart.element.sameNode(cursor.getSelectionAnchor().element) ? 'end' : 'start';

                // var wrapper = wlxmlNode.wrapText({
                //     _with: {tagName: params.wlxmlTag, attrs: {'class': params.wlxmlClass}},
                //     offsetStart: selectionStart.offset,
                //     offsetEnd: selectionEnd.offset,
                //     textNodeIdx: [wlxmlNode.indexOf(selectionStart.element.data('wlxmlNode')), wlxmlNode.indexOf(selectionEnd.element.data('wlxmlNode'))] //parent.childIndex(selectionEnd.element)]
                // }),
                wrapper = wlxmlNode.wrapText({
                    _with: {tagName: params.wlxmlTag, attrs: {'class': params.wlxmlClass}},
                    offsetStart: selectionStart.offset,
                    offsetEnd: selectionEnd.offset,
                    textNodeIdx: [wlxmlNode.indexOf(selectionStart.element.data('wlxmlNode')), wlxmlNode.indexOf(selectionEnd.element.data('wlxmlNode'))] //parent.childIndex(selectionEnd.element)]
                });
                wrapperCanvasElement = utils.findCanvasElement(wrapper);
                canvas.setCurrentElement(wrapperCanvasElement.children()[caretTo === 0 ? 0 : wrapperCanvasElement.children().length - 1], {caretTo: caretTo});
            }
        } else {
            var node1 = selectionStart.element.data('wlxmlNode'),
                node2 = selectionEnd.element.data('wlxmlNode'),
                siblingParents = canvas.wlxmlDocument.getSiblingParents({node1: node1, node2: node2});

            if(siblingParents) {
                // canvas.wlxmlDocument.wrapNodes({
                //     element1: siblingParents.node1,
                //     element2: siblingParents.node2,
                //     _with: {tagName: params.wlxmlTag, attrs: {klass: params.wlxmlClass}}
                // });
                canvas.wlxmlDocument.wrapNodes({
                    node1: siblingParents.node1,
                    node2: siblingParents.node2,
                    _with: {tagName: params.wlxmlTag, attrs: {klass: params.wlxmlClass}}
                });
            }
        }
    } else if(canvas.getCurrentNodeElement()) {
        wlxmlNode = canvas.getCurrentNodeElement().data('wlxmlNode');
            // wrapper = node.wrapWith({tagName: params.wlxmlTag, attrs: {klass: params.wlxmlClass}});
        wrapper = wlxmlNode.wrapWith({tagName: params.wlxmlTag, attrs: {'class': params.wlxmlClass}});
        canvas.setCurrentElement(utils.findCanvasElement(wrapper));
    }


});

commands.register('footnote', function(canvas, params) {
    void(params);
    var cursor = canvas.getCursor(),
        position = cursor.getPosition(),
        asideNode, asideElement;
        

    if(cursor.isSelectingWithinElement()) {
        asideNode = position.element.data('wlxmlNode').wrapWith({tagName: 'aside', attrs:{'class': 'footnote'}, start: cursor.getSelectionStart().offset, end: cursor.getSelectionEnd().offset});
    } else {
        asideNode = position.element.data('wlxmlNode').divideWithElementNode({tagName: 'aside', attrs:{'class': 'footnote'}}, {offset: position.offset});
        asideNode.append({text: ''});
    }

    asideElement = utils.findCanvasElement(asideNode);
    asideElement.toggle(true);
    canvas.setCurrentElement(asideElement);
});

commands.register('take-away-node', function(canvas) {
    var position = canvas.getCursor().getPosition(),
        element = position.element,
        nodeElement = element ? element.parent() : canvas.getCurrentNodeElement();

    if(!nodeElement || !(nodeElement.parent())) {
        return;
    }


    var range = nodeElement.data('wlxmlNode').unwrapContent();

    if(element) {
        var elementIsFirstChild = nodeElement.childIndex(element);
        if(element.bound()) {
            canvas.setCurrentElement(element, {caretTo: position.offset});
        } else {
            if(elementIsFirstChild) {
                canvas.setCurrentElement(utils.findCanvasElement(range.element1), {caretTo: 'end'});
            } else {
                canvas.setCurrentElement(utils.findCanvasElement(range.element2), {caretTo: 'end'});
            }
        }
    } else {
        canvas.setCurrentElement(utils.findCanvasElement(range.element1), {caretTo: 'start'});
    }

});


return {
    run: function(name, params, canvas) {
        return commands.run(name, params, canvas);
    }
};

});