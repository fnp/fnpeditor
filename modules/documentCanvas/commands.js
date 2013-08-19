define([
'modules/documentCanvas/canvas/documentElement'
], function(documentElement) {
    
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

commands.register('unwrap-node', function(canvas) {
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd(),
        parent1 = selectionStart.element.parent() || undefined,
        parent2 = selectionEnd.element.parent() || undefined;

    if(canvas.list.areItemsOfTheSameList({element1: parent1, element2: parent2})) {
        var selectionAnchor = cursor.getSelectionAnchor();
        canvas.list.extractItems({element1: parent1, element2: parent2});
        canvas.setCurrentElement(selectionAnchor.element, {caretTo: selectionAnchor.offset});
    } else if(!cursor.isSelecting()) {
        var toUnwrap = cursor.getPosition().element,
            parent = toUnwrap.unwrap();
        canvas.setCurrentElement(parent);
    }
});

commands.register('wrap-node', function(canvas) {
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd(),
        parent1 = selectionStart.element.parent() || undefined,
        parent2 = selectionEnd.element.parent() || undefined;

    if(canvas.list.areItemsOfTheSameList({element1: parent1, element2: parent2})) {
        canvas.list.create({element1: parent1, element2: parent2});
    }
});

commands.register('list', function(canvas, params) {
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd(),
        parent1 = selectionStart.element.parent() || undefined,
        parent2 = selectionEnd.element.parent() || undefined;

    var selectionFocus = cursor.getSelectionFocus();

    if(selectionStart.element.isInsideList() || selectionEnd.element.isInsideList()) {
        return;
    }

    canvas.list.create({element1: parent1, element2: parent2});

    canvas.setCurrentElement(selectionFocus.element, {caretTo: selectionFocus.offset});
});

commands.register('toggle-grid', function(canvas, params) {
    canvas.doc().dom().find('[wlxml-tag]').toggleClass('rng-common-hoveredNode', params.toggle);
    gridToggled = params.toggle;
});

commands.register('newNodeRequested', function(canvas, params) {
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd();

    if(cursor.isSelecting()) {
        if(cursor.isSelectingSiblings()) {
            if(cursor.isSelectingWithinElement()) {
                var newElement = selectionStart.element.wrapWithNodeElement({tag: params.wlxmlTag, klass: params.wlxmlClass, start: selectionStart.offset, end: selectionEnd.offset}),
                    caretTo = selectionStart.offset < selectionEnd.offset ? 'start' : 'end';
                canvas.setCurrentElement(newElement.children()[0], {caretTo: caretTo});
            }
            else {
                var parent = selectionStart.element.parent(),
                    caretTo = selectionStart.element.sameNode(cursor.getSelectionAnchor().element) ? 'end' : 'start';

                var wrapper = canvas.wrapText({
                    inside: parent,
                    _with: {tag: params.wlxmlTag, klass: params.wlxmlClass},
                    offsetStart: selectionStart.offset,
                    offsetEnd: selectionEnd.offset,
                    textNodeIdx: [parent.childIndex(selectionStart.element), parent.childIndex(selectionEnd.element)]
                });

                canvas.setCurrentElement(wrapper.children()[caretTo === 0 ? 0 : wrapper.children().length - 1], {caretTo: caretTo});
            }
        } else {
            var siblingParents = canvas.getSiblingParents({element1: selectionStart.element, element2: selectionEnd.element})
            if(siblingParents) {
                canvas.wrapElements({
                    element1: siblingParents.element1,
                    element2: siblingParents.element2,
                    _with: {tag: params.wlxmlTag, klass: params.wlxmlClass}
                });
            }
        }
    } else if(canvas.getCurrentNodeElement()) {
        var el = canvas.getCurrentNodeElement().wrapWithNodeElement({tag: params.wlxmlTag, klass: params.wlxmlClass});
        canvas.setCurrentElement(el);
    }


});

commands.register('footnote', function(canvas, params) {
    var cursor = canvas.getCursor(),
        position = cursor.getPosition(),
        asideElement;
        

    if(cursor.isSelectingWithinElement()) {
        asideElement = position.element.wrapWithNodeElement({tag: 'aside', klass: 'footnote', start: cursor.getSelectionStart().offset, end: cursor.getSelectionEnd().offset});
    } else {
        asideElement = position.element.divide({tag: 'aside', klass: 'footnote', offset: position.offset});
        asideElement.append({text: ''});
    }

    asideElement.toggle(true);
    canvas.setCurrentElement(asideElement);
});

commands.register('take-away-node', function(canvas) {
    var position = canvas.getCursor().getPosition(),
        element = position.element,
        nodeElement = element ? element.parent() : canvas.getCurrentNodeElement();

    if(!nodeElement || !(nodeElement.parent()))
        return;


    var range = nodeElement.unwrapContents();

    if(element) {
        var elementIsFirstChild = nodeElement.childIndex(element);
        if(element.bound()) {
            canvas.setCurrentElement(element, {caretTo: position.offset});
        } else {
            if(elementIsFirstChild) {
                canvas.setCurrentElement(range.element1, {caretTo: 'end'});
            } else {
                canvas.setCurrentElement(range.element2, {caretTo: 'end'});
            }
        }
    } else {
        canvas.setCurrentElement(range.element1, {caretTo: 'start'});
    }

});


return {
    run: function(name, params, canvas) {
        return commands.run(name, params, canvas);
    }
};

});