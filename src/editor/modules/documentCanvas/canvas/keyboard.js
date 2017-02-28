define([
'libs/jquery',
'modules/documentCanvas/canvas/utils'
], function($, utils) {
    
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
    { // ctrl+x - prevented (?)
        applies: function(e, s) {
            return e.ctrlKey &&
                e.key === KEYS.X &&
                s.type === 'textSelection' &&
                s.startsAtBeginning() &&
                s.endsAtEnd();
        },
        run: function(e,s) {
            void(s);
            e.preventDefault();
        }
    },
    {
        applies: function(e, s) {
            return e.key === KEYS.ARROW_UP && s.type === 'caret';
        },
        run: function(e, s) {
            /* globals window */
            var caretRect = window.getSelection().getRangeAt(0).getClientRects()[0],
                frameRects = s.element.dom[0].getClientRects(),
                caretTop = caretRect.bottom - caretRect.height,
                position, target,rect, scrolled;

            
            if((frameRects[0].bottom === caretRect.bottom) || (caretRect.left < frameRects[0].left)) {
                e.preventDefault();
                s.canvas.rootWrapper.find('[document-text-element]').each(function() {
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
                    s.canvas.setCurrentElement(s.canvas.getDocumentElement(position.textNode), {caretTo: position.offset});
                }
            }
            if(target) {
                scrolled = scroll('top', target);
                var left = caretRect.left;
                if(left > rect.left + rect.width) {
                    left = rect.left + rect.width;
                } else if(left < rect.left ) {
                    left = rect.left;
                }
                position = utils.caretPositionFromPoint(left, rect.bottom - 1 - scrolled);
                s.canvas.setCurrentElement(s.canvas.getDocumentElement(position.textNode), {caretTo: position.offset});
            }
        }
    },
    {
        applies: function(e, s) {
            return e.key === KEYS.ARROW_DOWN && s.type === 'caret';
        },
        run: function(e, s) {
            /* globals window */
            var caretRect = window.getSelection().getRangeAt(0).getClientRects()[0],
                frameRects = s.element.dom[0].getClientRects(),
                lastRect = frameRects[frameRects.length-1],
                position, target,rect, scrolled;

            if(lastRect.bottom === caretRect.bottom || (caretRect.left > lastRect.left + lastRect.width)) {
                e.preventDefault();
                s.canvas.rootWrapper.find('[document-text-element]').each(function() {
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
                    s.canvas.setCurrentElement(s.canvas.getDocumentElement(position.textNode), {caretTo: position.offset});
                }
            }
            if(target) {
                scrolled = scroll('bottom', target);
                var left = caretRect.left;
                if(left > rect.left + rect.width) {
                    left = rect.left + rect.width;
                } else if(left < rect.left ) {
                    left = rect.left;
                }
                position = utils.caretPositionFromPoint(left, rect.top +1 - scrolled);
                s.canvas.setCurrentElement(s.canvas.getDocumentElement(position.textNode), {caretTo: position.offset});
            }
        }
    },
    {
        applies: function(e, s) {
            return e.key === KEYS.ARROW_LEFT && s.type === 'caret';
        },
        run: function(e, s) {
            /* globals window */
            var prev;

            if(s.offset === 0) {
                e.preventDefault();
                prev = s.canvas.getPreviousTextElement(s.element);
                if(prev) {
                    scroll('top', prev.dom[0]);
                    s.canvas.setCurrentElement(s.canvas.getDocumentElement(prev.dom.contents()[0]), {caretTo: 'end'});
                }
            }
        }
    },
    {
        applies: function(e, s) {
            return e.key === KEYS.ARROW_RIGHT && s.type === 'caret';
        },
        run: function(e, s) {
            /* globals window */
            var next;
            if(s.isAtEnd()) {
                e.preventDefault();
                next = s.canvas.getNextTextElement(s.element);
                if(next) {
                    scroll('bottom', next.dom[0]);
                    s.canvas.setCurrentElement(s.canvas.getDocumentElement(next.dom.contents()[0]), {caretTo: 0});
                }
            } else {
                var secondToLast = (s.offset === s.element.wlxmlNode.getText().length -1);
                if(secondToLast) {
                    // Only Flying Spaghetti Monster knows why this is need for FF (for versions at least 26 to 31)
                    e.preventDefault();
                    s.canvas.setCurrentElement(s.element, {caretTo: 'end'});
                }
            }
        }
    },
    { // backspace removing the last character in a span
        applies: function(e, s) {
            return s.type === 'caret' &&
                s.element.wlxmlNode.parent().is({tagName: 'span'}) &&
                s.element.wlxmlNode.getText().length === 1 &&
                s.offset === 1 &&
                (e.key === KEYS.BACKSPACE);
        },
        run: function(e, s) {
            var params = {},
                prevTextNode = s.element.canvas.getPreviousTextElement(s.element).wlxmlNode;
            e.preventDefault();
            s.element.wlxmlNode.parent().detach(params);
            s.canvas.setCurrentElement(
                (params.ret && params.ret.mergedTo) || prevTextNode,
                {caretTo: params.ret ? params.ret.previousLen : (prevTextNode ? prevTextNode.getText().length : 0)});
        }
    },
    { // backspace/delete through an edge (behaves weirdly at spans)
        applies: function(e, s) {
            return s.type === 'caret' && (
                (s.isAtBeginning() && e.key === KEYS.BACKSPACE) ||
                (s.isAtEnd() && e.key === KEYS.DELETE)
            );
        },
        run: function(e,s) {
            var goto, element;

            if(e.key === KEYS.BACKSPACE) {
                element = s.element;
            }
            else {
                element = s.canvas.getNearestTextElement('below', s.element);
            }

            if(!element) {
                return;
            }


            var parent = element.wlxmlNode.parent();
            if(element.wlxmlNode.getIndex() === 0 && parent.isContextRoot() && (!parent.is('item') || parent.getIndex() === 0)) {
                // Don't even try to do anything at the edge of a context root, except for non-first items
                // - this is a temporary solution until key events handling get refactored into something more sane.
                return;
            }

            e.preventDefault();

            s.canvas.wlxmlDocument.transaction(function() {
                if(element.wlxmlNode.getIndex() === 0) {
                    goto = element.wlxmlNode.parent().moveUp();
                } else {
                    goto = element.wlxmlNode.moveUp();
                }
                if(goto) {
                   s.canvas.setCurrentElement(goto.node, {caretTo: goto.offset});
                }
            }, {
                metadata: {
                    description: gettext('Remove text')
                }
            });
        }
    },

    { // backspace/delete last character in a node - why is it needed?
        applies: function(e,s) {
            return s.type === 'caret' && s.element.getText().length === 1 && (e.key === KEYS.BACKSPACE || e.key === KEYS.DELETE);
        },
        run: function(e,s) {
            e.preventDefault();
            s.element.wlxmlNode.setText('');
            s.canvas.setCurrentElement(s.element, {caretTo: 0});
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

            if(s.startsAtBeginning && s.endsAtEnd && s.startElement.sameNode(s.endElement)) {
                goto = s.startElement;
                caretTo = s.startOffset;
            } else if(direction === 'above') {
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

            var doc = s.canvas.wlxmlDocument;
            doc.transaction(function() {
                
                doc.deleteText({
                    from: {
                        node: s.startElement.wlxmlNode,
                        offset: s.startOffset
                    },
                    to: {
                        node: s.endElement.wlxmlNode,
                        offset: s.endOffset
                    }
                });

            }, {
                success: function() {
                    if(goto) {
                        if(!doc.containsNode(goto.wlxmlNode)) {
                            goto = s.startElement;
                            caretTo = s.startOffset;
                        }
                        s.canvas.setCurrentElement(goto, {caretTo: caretTo});
                    }
                }
            });

        }
    },
    { // enter on an empty list item - creates paragraph after list
        applies: function(e, s) {
            var parent = s.element && s.element.wlxmlNode.parent(),
                parentIsItem = parent && parent.is('item'),
                itemIsOnList = parent && parent.parent() && parent.parent().is('list'),
                onlyChild = parent.contents().length === 1;
            return s.type === 'caret' && e.key === KEYS.ENTER && s.element.isEmpty() && onlyChild &&
                parentIsItem && itemIsOnList;
        },
        run: function(e, s) {
            var item = s.element.wlxmlNode.parent(),
                list = item.parent();
            e.preventDefault();
            s.canvas.wlxmlDocument.transaction(function() {
                var p = list.after({tagName: 'div', attrs: {'class': 'p'}});
                p.append({text: ''});
                item.detach();
                if(list.contents().length === 0) {
                    list.detach();
                }
                return p;
            }, {
                success: function(p) {
                    s.canvas.setCurrentElement(p);
                }
            });
        }
    },
    { // enter - split node
        applies: function(e, s) {
            return s.type === 'caret' && e.key === KEYS.ENTER && !s.element.parent().isRootElement();
        },
        run: function(e, s) {
            var parent = s.element.parent(),
                children = parent.children(),
                result, goto, gotoOptions;
            void(e);
            e.preventDefault();

            if(children.length === 1 && s.element.isEmpty()) {
                return;
            }

            s.canvas.wlxmlDocument.transaction(function() {
                result = s.element.wlxmlNode.breakContent({offset: s.offset});
            }, {
                metadata: {
                    description: gettext('Splitting text'),
                    fragment: s.toDocumentFragment()
                }
            });

            if(result.emptyText) {
                goto = result.emptyText;
                gotoOptions = {};
            } else {
                goto = result.second;
                gotoOptions = {caretTo: 'start'};
            }

            s.canvas.setCurrentElement(utils.getElementForNode(goto), gotoOptions);
        }
    },
    { // enter - new paragraph after image/video
        applies: function (e, s) {
            return s.type === 'nodeSelection' && e.key === KEYS.ENTER && !s.element.isRootElement();
        },
        run: function (e, s) {
            var parent = s.element.parent(),
                children = parent.children(),
                result, goto, gotoOptions;
            e.preventDefault();

            s.canvas.wlxmlDocument.transaction(function() {
                result = s.element.wlxmlNode.insertNewNode();
            }, {
                metadata: {
                    description: gettext('Inserting node'),
                    fragment: s.toDocumentFragment()
                }
            });

            s.canvas.setCurrentElement(utils.getElementForNode(result), {caretTo: 'start'});
        }
    }
];

return {
    handleKeyEvent: handleKeyEvent,
    KEYS: KEYS
};

});