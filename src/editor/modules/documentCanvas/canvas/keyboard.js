define([
'libs/jquery',
'modules/documentCanvas/canvas/documentElement',
'modules/documentCanvas/canvas/utils'
], function($, documentElement, utils) {
    
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


var scroll = function(place, textElement) {
    var rect = textElement.getBoundingClientRect(),
        scroll = $('#rng-module-documentCanvas-contentWrapper'),
        border = rect.bottom - (place === 'top' ? rect.height : 0) - scroll.offset().top + scroll[0].scrollTop,
        visible = scroll[0].scrollTop + {top: 0, bottom: scroll.height()}[place],
        padding = 16,
        toScroll = 0;
    
    if(place === 'top' && (border - padding < visible)) {
        toScroll =  border - visible - padding;
    } else if(place === 'bottom' && (border + padding > visible))  {
        toScroll = border - visible + padding;
    }
    if(toScroll) {
        scroll[0].scrollTop = scroll[0].scrollTop + toScroll;
    }
    return toScroll;
};

var getLastRectAbove = function(node, y) {
    var rects = node.getClientRects(),
        idx = 0,
        rect, toret;
    while((rect = rects[idx])) {
        if(rect.bottom < y) {
            toret = rect;
        } else {
            break;
        }
        idx++;
    }
    return toret;
};

var getFirstRectBelow = function(node, y) {
    var rects = node.getClientRects(),
        idx = 0,
        rect, toret;
    while((rect = rects[idx])) {
        if(rect.top > y) {
            toret = rect;
            break;
        }
        idx++;
    }
    return toret;
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
                        attrs: {'class': currentElement.wlxmlNode.getClass() || 'p'}
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
                        {tagName: element.wlxmlNode.getTagName() || 'div', attrs: {'class': element.wlxmlNode.getClass() || 'p'}}
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

handlers.push({keys: [KEYS.ARROW_UP],
    keydown: function(event, canvas) {
        /* globals window */
        var element = canvas.getCursor().getPosition().element,
            caretRect = window.getSelection().getRangeAt(0).getClientRects()[0],
            frameRects = element.dom[0].getClientRects(),
            caretTop = caretRect.bottom - caretRect.height,
            position, target,rect, scrolled;

        
        if((frameRects[0].bottom === caretRect.bottom) || (caretRect.left < frameRects[0].left)) {
            event.preventDefault();
            canvas.rootWrapper.find('[document-text-element]').each(function() {
                var test = getLastRectAbove(this, caretTop);
                if(test) {
                    target = this;
                    rect = test;
                } else {
                    return false;
                }
            });
            if(target) {
                scrolled = scroll('top', target);
                position = utils.caretPositionFromPoint(caretRect.left, rect.bottom - 1 - scrolled);
                canvas.setCurrentElement(canvas.getDocumentElement(position.textNode), {caretTo: position.offset});
            }
        }
    }
});

handlers.push({keys: [KEYS.ARROW_DOWN],
    keydown: function(event, canvas) {
        /* globals window */
        var element = canvas.getCursor().getPosition().element,
            caretRect = window.getSelection().getRangeAt(0).getClientRects()[0],
            frameRects = element.dom[0].getClientRects(),
            lastRect = frameRects[frameRects.length-1],
            position, target,rect, scrolled;

        if(lastRect.bottom === caretRect.bottom || (caretRect.left > lastRect.left + lastRect.width)) {
            event.preventDefault();
            canvas.rootWrapper.find('[document-text-element]').each(function() {
                var test = getFirstRectBelow(this, caretRect.bottom);
                if(test) {
                    target = this;
                    rect = test;
                    return false;
                }
            });
            if(target) {
                scrolled = scroll('bottom', target);
                position = utils.caretPositionFromPoint(caretRect.left, rect.top +1 - scrolled);
                canvas.setCurrentElement(canvas.getDocumentElement(position.textNode), {caretTo: position.offset});
            }
        }
    }
});

handlers.push({keys: [KEYS.ARROW_LEFT],
    keydown: function(event, canvas) {
        /* globals window */
        var position = canvas.getCursor().getPosition(),
            element = position.element,
            prev;

        if(position.offset === 0) {
            event.preventDefault();
            prev = canvas.getPreviousTextElement(element);
            if(prev) {
                scroll('top', prev.dom[0]);
                canvas.setCurrentElement(canvas.getDocumentElement(prev.dom.contents()[0]), {caretTo: 'end'});
            }
        }
    }
});

handlers.push({keys: [KEYS.ARROW_RIGHT],
    keydown: function(event, canvas) {
        /* globals window */
        var position = canvas.getCursor().getPosition(),
            element = position.element,
            next;
        if(position.offsetAtEnd) {
            event.preventDefault();
            next = canvas.getNextTextElement(element);
            if(next) {
                scroll('bottom', next.dom[0]);
                canvas.setCurrentElement(canvas.getDocumentElement(next.dom.contents()[0]), {caretTo: 0});
            }
        } else {
            var secondToLast = (position.offset === element.wlxmlNode.getText().length -1);
            if(secondToLast) {
                // Only Flying Spaghetti Monster knows why this is need for FF (for versions at least 26 to 31)
                event.preventDefault();
                canvas.setCurrentElement(element, {caretTo: 'end'});
            }
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

        if(cursor.isSelecting()) {
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
            else if(cursorAtOperationEdge) {
                if(direction === 'below') {
                    element = canvas.getNearestTextElement(direction, element);
                }
                if(element && element.wlxmlNode.getIndex() === 0) {
                    goto = element.wlxmlNode.parent().moveUp();
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

var handleKeyEvent = function(e, s) {
    keyEventHandlers.some(function(handler) {
        if(handler.applies(e, s)) {
            handler.run(e, s);
            return true;
        }
    });
};
// todo: whileRemoveWholetext
var keyEventHandlers = [
    {
        applies: function(e, s) {
            return s.type === 'caret' && (
                (s.isAtBeginning() && e.key === KEYS.BACKSPACE) ||
                (s.isAtEnd() && e.key === KEYS.DELETE)
            );
        },
        run: function(e,s) {
            var direction, caretTo, cursorAtOperationEdge, goto, element;

            if(e.key === KEYS.BACKSPACE) {
                direction = 'above';
                caretTo = 'end';
                cursorAtOperationEdge = s.isAtBeginning();
                element = s.element;
            }
            else {
                direction = 'below';
                caretTo = 'start';
                cursorAtOperationEdge = s.isAtEnd();
                if(cursorAtOperationEdge) {
                    element = cursorAtOperationEdge && s.canvas.getNearestTextElement(direction, s.element);
                }
            }

            if(!cursorAtOperationEdge || !element) {
                return;
            }

            e.preventDefault();

            s.canvas.wlxmlDocument.transaction(function() {
                if(element.wlxmlNode.getIndex() === 0) {
                    goto = element.wlxmlNode.parent().moveUp();
                    if(goto) {
                        s.canvas.setCurrentElement(goto.node, {caretTo: goto.offset});
                    }
                }
            }, {
                metadata: {
                    description: gettext('Remove text')
                }
            });
        }
    }, 

    {
        applies: function(e, s) {
            return s.type === 'textSelection' && (e.key === KEYS.BACKSPACE || e.key === KEYS.DELETE);
        },
        run: function(e, s) {
            var direction = 'above',
                caretTo = 'end',
                goto;

                
            if(e.key === KEYS.DELETE) {
                direction = 'below';
                caretTo = 'start';
            }

            e.preventDefault();
            if(direction === 'above') {
                if(s.startsAtBeginning()) {
                    goto = s.canvas.getNearestTextElement('above', s.startElement);
                    caretTo = 'end';
                } else {
                    goto = s.startElement;
                    caretTo = s.startOffset;
                }
            } else {
                if(s.endsAtEnd()) {
                    goto = s.canvas.getNearestTextElement('below', s.startElement);
                    caretTo = 'start';
                } else {
                    goto = s.endElement;
                    caretTo = 0;
                }
            }

            s.canvas.wlxmlDocument.deleteText({
                from: {
                    node: s.startElement.wlxmlNode,
                    offset: s.startOffset
                },
                to: {
                    node: s.endElement.wlxmlNode,
                    offset: s.endOffset
                }
            });
            if(goto) {
                s.canvas.setCurrentElement(goto, {caretTo: caretTo});
            }
        }
    }
];

return {
    handleKey: handleKey,
    handleKeyEvent: handleKeyEvent,
    KEYS: KEYS
};

});