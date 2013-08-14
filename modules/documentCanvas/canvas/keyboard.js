define([
'modules/documentCanvas/canvas/documentElement',
'modules/documentCanvas/canvas/utils'
], function(documentElement, utils) {
    
'use strict';


var KEYS = {
    ENTER: 13,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
    BACKSPACE: 8,
    DELETE: 46,
    X: 88
};

var handleKey = function(event, canvas) {
    handlers.some(function(handler) {
        if(handles(handler, event) && handler[event.type]) {
            handler[event.type](event, canvas);
            return true;
        }
    });
};

var handles = function(handler, event) {
    if(handler.key === event.which)
        return true;
    if(handler.keys && handler.keys.indexOf(event.which) !== -1)
        return true;
    return false;
};

var handlers = [];


handlers.push({key: KEYS.ENTER,
    keydown: function(event, canvas) {
        event.preventDefault();
        var cursor = canvas.getCursor(),
            position = cursor.getPosition(),
            element = position.element;

        if(!cursor.isSelecting()) {
            if(event.ctrlKey) {
                var added = element.after({tag: 'block'});
                added.append({text:''});
                canvas.setCurrentElement(added, {caretTo: 'start'});

            } else {

                if(!(element.parent().parent())) {
                    return false; // top level element is unsplittable
                }

                var elements = position.element.split({offset: position.offset}),
                    newEmpty,
                    goto,
                    gotoOptions;

                if(position.offsetAtBeginning)
                    newEmpty = elements.first;
                else if(position.offsetAtEnd)
                    newEmpty = elements.second;
                
                if(newEmpty) {
                    goto = newEmpty.append(documentElement.DocumentTextElement.create({text: ''}, this));
                    gotoOptions = {};
                } else {
                    goto = elements.second;
                    gotoOptions = {caretTo: 'start'};
                }

                canvas.setCurrentElement(goto, gotoOptions);
            }
        }
    }
});

handlers.push({keys: [KEYS.ARROW_UP, KEYS.ARROW_DOWN, KEYS.ARROW_LEFT, KEYS.ARROW_RIGHT],
    keydown: function(event, canvas) {
        var position = canvas.getCursor().getPosition(),
            element = position.element;
        if(element && (element instanceof documentElement.DocumentTextElement) && element.isEmpty()) {
            var direction, caretTo;
            if(event.which === KEYS.ARROW_LEFT  || event.which === KEYS.ARROW_UP) {
                direction = 'above';
                caretTo = 'end';
            } else {
                direction = 'below';
                caretTo = 'start';
            }
            var el = canvas.getDocumentElement(utils.nearestInDocumentOrder('[document-text-element]', direction, element.dom()[0]));
            canvas.setCurrentElement(el, {caretTo: caretTo});
        }
    },
    keyup: function(event, canvas) {
        var element = canvas.getCursor().getPosition().element,
            caretTo = false;
        if(!element) {
            // Chrome hack
            var direction;
            if(event.which === KEYS.ARROW_LEFT  || event.which === KEYS.ARROW_UP) {
                direction = 'above';
                caretTo = 'end';
            } else {
                direction = 'below';
                caretTo = 'start';
            }
            element = canvas.getDocumentElement(utils.nearestInDocumentOrder('[document-text-element]:visible', direction, window.getSelection().focusNode));
        }
        canvas.setCurrentElement(element, {caretTo: caretTo});
    }
});


var selectsWholeTextElement = function(cursor) {
    if(cursor.isSelecting() && cursor.getSelectionStart().offsetAtBeginning && cursor.getSelectionEnd().offsetAtEnd)
        return true;
    return false;
}

handlers.push({key: KEYS.X,
    keydown: function(event, canvas) {
        if(event.ctrlKey && selectsWholeTextElement(canvas.getCursor()))
            event.preventDefault();
    }
});

handlers.push({keys: [KEYS.BACKSPACE, KEYS.DELETE],
    keydown: function(event, canvas) {
        var cursor = canvas.getCursor(),
            position = canvas.getCursor().getPosition(),
            element = position.element;

        if(cursor.isSelecting() && !cursor.isSelectingWithinElement()) {
            event.preventDefault();
            return;
        }
            
        var cursorAtOperationEdge = position.offsetAtBeginning;
        if(event.which === KEYS.DELETE) {
            cursorAtOperationEdge = position.offsetAtEnd;
        }

        var willDeleteWholeText = function() {
            return element.getText().length === 1 || selectsWholeTextElement(cursor);
        }

        if(willDeleteWholeText()) {
            event.preventDefault();
            element.setText('');
        }
        else if(element.isEmpty()) {

            var direction = 'above',
                caretTo = 'end';
                
            if(event.which === KEYS.DELETE) {
                direction = 'below';
                caretTo = 'start';
            }

            event.preventDefault();

            var parent = element.parent(),
                grandParent = parent ? parent.parent() : null,
                goto;
            if(parent.children().length === 1 && parent.children()[0].sameNode(element)) {
                if(grandParent && grandParent.children().length === 1) {
                    goto = grandParent.append({text: ''});
                } else {
                    goto = element.getNearestTextElement(direction);
                }
                parent.detach();
            } else {
                goto = element.getNearestTextElement(direction);
                element.detach();
            }
            canvas.setCurrentElement(goto, {caretTo: caretTo});
            canvas.publisher('contentChanged');
        }
        else if(cursorAtOperationEdge) {
            // todo
            event.preventDefault();
        }
    }
});

return {
    handleKey: handleKey
};

});