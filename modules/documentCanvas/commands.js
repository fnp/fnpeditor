define([

], function() {
    
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

commands.register('toggle-list', function(canvas, params) {
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd(),
        parent1 = selectionStart.element.parent() || undefined,
        parent2 = selectionEnd.element.parent() || undefined;

    var selectionFocus = cursor.getSelectionFocus();
    if(params.toggle) {
        canvas.list.create({element1: parent1, element2: parent2});
    } else {
        if(canvas.list.areItemsOfTheSameList({element1: parent1, element2: parent2})) {
            canvas.list.extractItems({element1: parent1, element2: parent2, merge: false});
        } 
    }
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

    if(cursor.isSelecting() && cursor.isSelectingSiblings()) {
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
    }
});


return {
    run: function(name, params, canvas) {
        return commands.run(name, params, canvas);
    }
};

});