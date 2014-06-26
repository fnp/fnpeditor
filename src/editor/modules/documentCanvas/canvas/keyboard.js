define([
'modules/documentCanvas/canvas/documentElement',
'modules/documentCanvas/canvas/utils'
], function(documentElement, utils) {
    
'use strict';
/* globals gettext */

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
    if(handler.key === event.which) {
        return true;
    }
    if(handler.keys && handler.keys.indexOf(event.which) !== -1) {
        return true;
    }
    return false;
};

var handlers = [];


handlers.push({key: KEYS.ENTER,
    keydown: function(event, canvas) {
        event.preventDefault();
        var cursor = canvas.getCursor(),
            position = cursor.getPosition(),
            element = position.element;

        if(Object.keys(cursor.getPosition()).length === 0) {
            var currentElement = canvas.getCurrentNodeElement();
            if(currentElement && !currentElement.wlxmlNode.isRoot()) {
                canvas.wlxmlDocument.transaction(function() {
                    var added = currentElement.wlxmlNode.after({
                        tagName: currentElement.wlxmlNode.getTagName() || 'div',
                        attrs: {'class': currentElement.getWlxmlClass() || 'p'}
                    });
                    added.append({text:''});
                    return added;
                }, {
                    metadata: {
                        description: gettext('Splitting text')
                    },
                    success: function(ret) {
                        canvas.setCurrentElement(utils.getElementForNode(ret), {caretTo: 'start'});
                    }
                });

            }
            return;
        }

        if(!cursor.isSelecting()) {
            if(event.ctrlKey) {
                if(element instanceof documentElement.DocumentTextElement) {
                    element = element.parent();
                }

                canvas.wlxmlDocument.transaction(function() {
                    var added = element.wlxmlNode.after(
                        {tagName: element.wlxmlNode.getTagName() || 'div', attrs: {'class': element.getWlxmlClass() || 'p'}}
                    );
                    added.append({text: ''});
                    return added;
                }, {
                    metadata: {
                        description: gettext('Splitting text')
                    },
                    success: function(ret) {
                        canvas.setCurrentElement(utils.getElementForNode(ret), {caretTo: 'start'});
                    }
                });

            } else {

                if(!(element.parent().parent())) {
                    return false; // top level element is unsplittable
                }

                //var nodes = position.element.data('wlxmlNode').split({offset: position.offset}),
                // var nodes = position.element.data('wlxmlNode').transform('split', {offset: position.offset}),
                //     newEmpty,
                //     goto,
                //     gotoOptions;

                // if(position.offsetAtBeginning)
                //     newEmpty = nodes.first;
                // else if(position.offsetAtEnd)
                //     newEmpty = nodes.second;
                
                // if(newEmpty) {
                //     //goto = newEmpty.append({text: ''});
                //     gotoOptions = {};
                // } else {
                //     goto = nodes.second;
                //     gotoOptions = {caretTo: 'start'};
                // }
                var node = position.element.wlxmlNode,
                    result, goto, gotoOptions;

                node.document.transaction(function() {
                    result = position.element.wlxmlNode.breakContent({offset: position.offset});
                }, {
                    metadata: {
                        description: gettext('Splitting text')
                    }
                });

                if(result.emptyText) {
                    goto = result.emptyText;
                    gotoOptions = {};
                } else {
                    goto = result.second;
                    gotoOptions = {caretTo: 'start'};
                }

                canvas.setCurrentElement(utils.getElementForNode(goto), gotoOptions);
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
            var el = canvas.getDocumentElement(utils.nearestInDocumentOrder('[document-text-element]', direction, element.dom[0]));
            if(el) {
                canvas.setCurrentElement(el, {caretTo: caretTo});
            }
        }
    },
    keyup: function(event, canvas) {
        var element = canvas.getCursor().getPosition().element,
            caretTo = false;
        if(!element) {
            // Chrome hack

            var moves = [{direction: 'above', caretTo: 'end'}, {direction: 'below', caretTo: 'start'}];
            if(event.which === KEYS.ARROW_RIGHT  || event.which === KEYS.ARROW_DOWN) {
                moves.reverse();
            }
            moves.some(function(move) {
                /* globals window */
                var targetNode = utils.nearestInDocumentOrder('[document-text-element]:visible', move.direction, window.getSelection().focusNode);
                if(targetNode) {
                    element = canvas.getDocumentElement(targetNode);
                    caretTo = move.caretTo;
                    return true; // break
                }
            });
        }
        if(element) {
            canvas.setCurrentElement(element, {caretTo: caretTo});
        }
    }
});


var selectsWholeTextElement = function(cursor) {
    if(cursor.isSelecting() && cursor.getSelectionStart().offsetAtBeginning && cursor.getSelectionEnd().offsetAtEnd) {
        return true;
    }
    return false;
};

handlers.push({key: KEYS.X,
    keydown: function(event, canvas) {
        if(event.ctrlKey && selectsWholeTextElement(canvas.getCursor())) {
            event.preventDefault();
        }
    }
});

handlers.push({keys: [KEYS.BACKSPACE, KEYS.DELETE],
    keydown: function(event, canvas) {
        var cursor = canvas.getCursor(),
            position = canvas.getCursor().getPosition(),
            element = position.element,
            node = element ? element.wlxmlNode : null,
            direction = 'above',
            caretTo = 'end',
            goto;

        if(!element || !node) {
            return;
        }
            
        if(event.which === KEYS.DELETE) {
            direction = 'below';
            caretTo = 'start';
        }

        if(cursor.isSelecting() && !cursor.isSelectingWithinElement()) {
            event.preventDefault();
            var start = cursor.getSelectionStart(),
                end = cursor.getSelectionEnd();

            if(direction === 'above') {
                if(start.offsetAtBeginning) {
                    goto = canvas.getNearestTextElement('above', start.element);
                    caretTo = 'end';
                } else {
                    goto = start.element;
                    caretTo = start.offset;
                }
            } else {
                if(end.offsetAtEnd) {
                    goto = canvas.getNearestTextElement('below', start.element);
                    caretTo = 'start';
                } else {
                    goto = end.element;
                    caretTo = 0;
                }
            }

            canvas.wlxmlDocument.deleteText({
                from: {
                    node: start.element.wlxmlNode,
                    offset: start.offset
                },
                to: {
                    node: end.element.wlxmlNode,
                    offset: end.offset
                }
            });
            if(goto) {
                canvas.setCurrentElement(goto, {caretTo: caretTo});
            }
            return;
        }
            
        var cursorAtOperationEdge = position.offsetAtBeginning;
        if(event.which === KEYS.DELETE) {
            cursorAtOperationEdge = position.offsetAtEnd;
        }

        var willDeleteWholeText = function() {
            return element.getText().length === 1 || selectsWholeTextElement(cursor);
        };

        canvas.wlxmlDocument.transaction(function() {
            if(willDeleteWholeText()) {
                event.preventDefault();
                node.setText('');
            }
            else if(element.isEmpty()) {
                event.preventDefault();
                var parent = element.parent(),
                    grandParent = parent ? parent.parent() : null;
                if(!grandParent && parent.children().length === 1) {
                    return;
                }
                if(parent.children().length === 1 && parent.children()[0].sameNode(element)) {
                    if(grandParent && grandParent.children().length === 1) {
                        goto = grandParent.wlxmlNode.append({text: ''});
                    } else {
                        goto = canvas.getNearestTextElement(direction, element);
                    }
                    parent.wlxmlNode.detach();
                } else {
                    goto = canvas.getNearestTextElement(direction, element);
                    element.wlxmlNode.detach();
                }
                canvas.setCurrentElement(goto, {caretTo: caretTo});
            }
            else if(cursorAtOperationEdge) {
                if(direction === 'below') {
                    element = canvas.getNearestTextElement(direction, element);
                }
                if(element) {
                    goto = element.wlxmlNode.mergeContentUp();
                    if(goto) {
                        canvas.setCurrentElement(goto.node, {caretTo: goto.offset});
                    }
                }
                event.preventDefault();
            }
        }, {
            metadata: {
                description: gettext('Remove text')
            }
        });
    }
});

return {
    handleKey: handleKey
};

});