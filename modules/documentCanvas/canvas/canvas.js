define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'modules/documentCanvas/canvas/documentElement'
], function($, _, documentElement) {
    
'use strict';

var Canvas = function(wlxml, publisher) {
    this.loadWlxml(wlxml);
    this.publisher = publisher ? publisher : function() {};
};

$.extend(Canvas.prototype, {

    loadWlxml: function(wlxml) {
        var d = wlxml ? $($.trim(wlxml)) : null;
        if(d) {
            this.wrapper = $('<div>').addClass('canvas-wrapper').attr('contenteditable', true);
            this.wrapper.append(d);
            
            this.wrapper.find('*').replaceWith(function() {
                var currentTag = $(this);
                if(currentTag.attr('wlxml-tag'))
                    return;

                var meta = {};
                for(var i = 0; i < this.attributes.length; i++) {
                    var attr = this.attributes[i];
                    if(attr.name.substr(0, 5) === 'meta-')
                        meta[attr.name.substr(5)] = attr.value;
                }

                var element = documentElement.DocumentNodeElement.create({
                    tag: currentTag.prop('tagName').toLowerCase(),
                    klass: currentTag.attr('class'),
                    meta: meta
                });

                element.dom().append(currentTag.contents());
                ['orig-before', 'orig-append'].forEach(function(attr) {
                    element.data(attr, '');
                });
                return element.dom();
            });

            this.wrapper.find(':not(iframe)').addBack().contents()
                .filter(function() {return this.nodeType === Node.TEXT_NODE})
                .each(function() {

                    var el = $(this);
                    
                    // TODO: use DocumentElement API
                    var spanParent = el.parent().attr('wlxml-tag') === 'span',
                        spanBefore = el.prev().length > 0  && $(el.prev()[0]).attr('wlxml-tag') === 'span',
                        spanAfter = el.next().length > 0 && $(el.next()[0]).attr('wlxml-tag') === 'span';
                        
                    var oldText = this.data,
                        oldLength = this.data.length;
                    var parent = el.parent(),
                        parentContents = parent.contents(),
                        idx = parentContents.index(this),
                        next = idx < parentContents.length - 1 ? parentContents[idx+1] : null;

                    var addInfo = function() {
                        if(next) {
                            $(next).data('orig-before', oldText);
                        } else {
                            parent.data('orig-append', oldText);
                        }
                    }

                    if(spanParent || spanBefore || spanAfter) {
                        var startSpace = /\s/g.test(this.data.substr(0,1));
                        var endSpace = /\s/g.test(this.data.substr(-1)) && this.data.length > 1;
                        var trimmed = $.trim(this.data);
                        var newText = (startSpace && (spanParent || spanBefore) ? ' ' : '')
                                    + trimmed
                                    + (endSpace && (spanParent || spanAfter) ? ' ' : '');
                        if(newText !== oldText) {
                            this.data = newText;
                            addInfo();
                        }
                    } else {

                        this.data = $.trim(this.data);
                        if(this.data.length === 0 && oldLength > 0 && el.parent().contents().length === 1)
                            this.data = ' ';
                        if(this.data.length === 0) {
                            addInfo();
                            el.remove();

                            return true; // continue
                        }
                    }

                    var element = documentElement.DocumentTextElement.create({text: this.data});
                    $(this).replaceWith(element.dom());
                });
            
            this.d = this.wrapper.children(0);

            var canvas = this;
            this.wrapper.on('keydown', function(e) {
                if(e.which === 13) { 
                    e.preventDefault();
                    var cursor = canvas.getCursor();
                    if(!cursor.isSelecting()) {
                        var position = cursor.getPosition(),
                            elements = position.element.split({offset: position.offset}),
                            newEmpty,
                            goto;

                        if(position.offsetAtBeginning)
                            newEmpty = elements.first;
                        else if(position.offsetAtEnd)
                            newEmpty = elements.second;
                        if(newEmpty) {
                            goto = newEmpty.append(documentElement.DocumentTextElement.create({text: '\u200B'}, this));
                            canvas.setCurrentElement(goto);
                        }
                    }
                }
            });

            this.wrapper.on('keyup', function(e) {
                if(e.which >= 37 && e.which <= 40)
                    canvas.setCurrentElement(canvas.getCursor().getPosition().element, {caretTo: false})
            });

            this.wrapper.on('click', '[wlxml-tag], [wlxml-text]', function(e) {
                e.stopPropagation();
                canvas.setCurrentElement(canvas.getDocumentElement(e.target), {caretTo: false});
            });

        } else {
            this.d = null;
        }
    },

    view: function() {
        return this.wrapper;
    },

    doc: function() {
        if(this.d === null)
            return null;
        return documentElement.DocumentNodeElement.fromHTMLElement(this.d.get(0), this); //{wlxmlTag: this.d.prop('tagName')};
    },

    wrapText: function(params) {
        params = _.extend({textNodeIdx: 0}, params);
        if(typeof params.textNodeIdx === 'number')
            params.textNodeIdx = [params.textNodeIdx];
        
        var childrenInside = params.inside.children(),
            idx1 = Math.min.apply(Math, params.textNodeIdx),
            idx2 = Math.max.apply(Math, params.textNodeIdx),
            textNode1 = childrenInside[idx1],
            textNode2 = childrenInside[idx2],
            sameNode = textNode1.sameNode(textNode2),
            prefixOutside = textNode1.getText().substr(0, params.offsetStart),
            prefixInside = textNode1.getText().substr(params.offsetStart),
            suffixInside = textNode2.getText().substr(0, params.offsetEnd),
            suffixOutside = textNode2.getText().substr(params.offsetEnd)
        ;
        
        var wrapperElement = documentElement.DocumentNodeElement.create({tag: params._with.tag, klass: params._with.klass});
        textNode1.after(wrapperElement);
        textNode1.detach();
        
        if(prefixOutside.length > 0)
            wrapperElement.before({text:prefixOutside});
        if(sameNode) {
            var core = textNode1.getText().substr(params.offsetStart, params.offsetEnd - params.offsetStart);
            wrapperElement.append({text: core});
        } else {
            textNode2.detach();
            if(prefixInside.length > 0)
                wrapperElement.append({text: prefixInside});
            for(var i = idx1 + 1; i < idx2; i++) {
                wrapperElement.append(childrenInside[i]);
            }
            if(suffixInside.length > 0)
                wrapperElement.append({text: suffixInside});
        }
        if(suffixOutside.length > 0)
            wrapperElement.after({text: suffixOutside});
        return wrapperElement;
    },
    getDocumentElement: function(from) {
        if(from instanceof HTMLElement || from instanceof Text) {
           return documentElement.DocumentElement.fromHTMLElement(from, this);
        }
    },
    getCursor: function() {
        return new Cursor(this);
    },

    list: {},



    highlightElement: function(element) {
        this.wrapper.find('.highlighted-element').removeClass('highlighted-element');
        element.dom().addClass('highlighted-element');
    },

    dimElement: function(element) {
        element.dom().removeClass('highlighted-element');
    },
    
    getCurrentNodeElement: function() {
        return this.getDocumentElement(this.wrapper.find('.current-node-element')[0]);
    },

    getCurrentTextElement: function() {
        return this.getDocumentElement(this.wrapper.find('.current-text-element')[0]);
    },



    setCurrentElement: function(element, params) {
        params = _.extend({caretTo: 'end'}, params);
        var findFirstDirectTextChild = function(e, nodeToLand) {
            var byBrowser = this.getCursor().getPosition().element;
            if(byBrowser && byBrowser.parent().sameNode(nodeToLand))
                return byBrowser;
            var children = e.children();
            for(var i = 0; i < children.length; i++) {
                if(children[i] instanceof documentElement.DocumentTextElement)
                    return children[i];
            }
            return null;
        }.bind(this);
        var _markAsCurrent = function(element) {
            if(element instanceof documentElement.DocumentTextElement) {
                this.wrapper.find('.current-text-element').removeClass('current-text-element');
                element.dom().addClass('current-text-element');
            } else {
                this.wrapper.find('.current-node-element').removeClass('current-node-element')
                element.dom().addClass('current-node-element');
                this.publisher('currentElementChanged', element);
            }
        }.bind(this);


        var isTextElement = element instanceof documentElement.DocumentTextElement,
            nodeElementToLand = isTextElement ? element.parent() : element,
            textElementToLand = isTextElement ? element : findFirstDirectTextChild(element, nodeElementToLand),
            currentTextElement = this.getCurrentTextElement(),
            currentNodeElement = this.getCurrentNodeElement();

        if(currentTextElement && !(currentTextElement.sameNode(textElementToLand)))
            this.wrapper.find('.current-text-element').removeClass('current-text-element');

        if(textElementToLand) {
            _markAsCurrent(textElementToLand);
            if(params.caretTo || !textElementToLand.sameNode(this.getCursor().getPosition().element))
                this._moveCaretToTextElement(textElementToLand, params.caretTo); // as method on element?
            if(!(textElementToLand.sameNode(currentTextElement)))
                this.publisher('currentTextElementSet', textElementToLand);
        } else {
            document.getSelection().removeAllRanges();
        }

        if(!(currentNodeElement && currentNodeElement.sameNode(nodeElementToLand))) {
            _markAsCurrent(nodeElementToLand);

            this.publisher('currentNodeElementSet', nodeElementToLand);
        }
    },

    _moveCaretToTextElement: function(element, where) {
        var range = document.createRange(),
            node = element.dom().contents()[0];

        if(typeof where !== 'number') {
            range.selectNodeContents(node);
        } else {
            range.setStart(node, where);
        }
        
        var collapseArg = true;
        if(where === 'end')
            collapseArg = false;
        range.collapse(collapseArg);
        
        var selection = document.getSelection();

        selection.removeAllRanges();
        selection.addRange(range);
        this.wrapper.focus(); // FF requires this for caret to be put where range colllapses, Chrome doesn't.
    },

    setCursorPosition: function(position) {
        if(position.element)
            this._moveCaretToTextElement(position.element, position.offset);
    },

    toXML: function() {
        var d = function(element, parent, level) {
            console.log(element.getText ? 'text: ' + element.getText() : 'node: ' + element.getWlxmlTag());
            var isElementNode = element instanceof documentElement.DocumentNodeElement;
            parent.prepend(element.toXML(level));
            if(isElementNode) {
                var dom = $(parent.children()[0]),
                    elementChildren = element.children();
                for(var i = elementChildren.length - 1; i >= 0; i--) {
                    d(elementChildren[i], dom, level + 1);
                }
            }
        }
        var parent = $('<div>');
        d(this.doc(), parent, 0);
        return parent.html();
    }
});

$.extend(Canvas.prototype.list, {
    create: function(params) {
        if(!(params.element1.parent().sameNode(params.element2.parent())))
            return false;
            
        var parent = params.element1.parent();
        
        if(parent.childIndex(params.element1) > parent.childIndex(params.element2)) {
            var tmp = params.element1;
            params.element1 = params.element2;
            params.element2 = tmp;
        }
        
        var elementsToWrap = [];
        
        var place = 'before';
        var canvas = this;
        parent.children().some(function(element) {
            var _e = element;
            if(element.sameNode(params.element1))
                place = 'inside';
            if(place === 'inside') {
                if(element instanceof documentElement.DocumentTextElement) {
                    element = element.wrapWithNodeElement({tag: 'div', klass: 'list.item'});
                    if(element.children()[0].sameNode(params.element1))
                        params.element1 = element;
                }
                element.setWlxmlClass('item');
                elementsToWrap.push(element);
            }
            if(_e.sameNode(params.element2))
                return true;
        });
        
        var listElement = documentElement.DocumentNodeElement.create({tag: 'div', klass: 'list-items' + (params.type === 'enum' ? '-enum' : '')});
        
        var toret;
        if(parent.is('list')) {
            listElement.wrapWithNodeElement({tag: 'div', klass: 'item'});
            toret = listElement.parent();
        } else {
            toret = listElement;
        }  
        
        params.element1.before(toret);
        
        elementsToWrap.forEach(function(element) {
            element.detach();
            listElement.append(element);
        });
    },
    extractItems: function(params) {
        params = _.extend({merge: true}, params);
        var list = params.element1.parent();
        if(!list.is('list') || !(list.sameNode(params.element2.parent())))
            return false;

        var idx1 = list.childIndex(params.element1),
            idx2 = list.childIndex(params.element2),
            precedingItems = [],
            extractedItems = [],
            succeedingItems = [],
            items = list.children(),
            listIsNested = list.parent().getWlxmlClass() === 'item',
            i;

        if(idx1 > idx2) {
            var tmp = idx1; idx1 = idx2; idx2 = tmp;
        }

        items.forEach(function(item, idx) {
            if(idx < idx1)
                precedingItems.push(item);
            else if(idx >= idx1 && idx <= idx2) {
                extractedItems.push(item);
            }
            else {
                succeedingItems.push(item);
            }
        });

        var reference = listIsNested ? list.parent() : list;
        if(succeedingItems.length === 0) {
            var reference_orig = reference;
            extractedItems.forEach(function(item) {
                reference.after(item);
                reference = item;
                if(!listIsNested)
                    item.setWlxmlClass(null);
            });
            if(precedingItems.length === 0)
                reference_orig.detach();
        } else if(precedingItems.length === 0) {
            extractedItems.forEach(function(item) {
                reference.before(item);
                if(!listIsNested)
                    item.setWlxmlClass(null);
            });
        } else {
            extractedItems.forEach(function(item) {
                reference.after(item);
                if(!listIsNested)
                    item.setWlxmlClass(null);
                reference = item;
            });
            var secondList = documentElement.DocumentNodeElement.create({tag: 'div', klass:'list-items'}, this),
                toAdd = secondList;
            
            if(listIsNested) {
                toAdd = secondList.wrapWithNodeElement({tag: 'div', klass:'item'});
            }
            succeedingItems.forEach(function(item) {
                secondList.append(item);
            });

            reference.after(toAdd);
        }
        if(!params.merge && listIsNested) {
            return this.extractItems({element1: extractedItems[0], element2: extractedItems[extractedItems.length-1]});
        }
        return true;
    },
    areItemsOfTheSameList: function(params) {
        var e1 = params.element1,
            e2 = params.element2;
        return e1.parent().sameNode(e2.parent())
            && e1.parent().is('list');
    }
});


var Cursor = function(canvas) {
    this.canvas = canvas;
};

$.extend(Cursor.prototype, {
    isSelecting: function() {
        var selection = window.getSelection();
        return !selection.isCollapsed;
    },
    isSelectingWithinElement: function() {
        return this.isSelecting() && this.getSelectionStart().element.sameNode(this.getSelectionEnd().element);
    },
    isSelectingSiblings: function() {
        return this.isSelecting() && this.getSelectionStart().element.parent().sameNode(this.getSelectionEnd().element.parent());
    },
    getPosition: function() {
        return this.getSelectionAnchor();
    },
    getSelectionStart: function() {
        return this.getSelectionBoundry('start');
    },
    getSelectionEnd: function() {
        return this.getSelectionBoundry('end');
    },
    getSelectionAnchor: function() {
        return this.getSelectionBoundry('anchor');
    },
    getSelectionFocus: function() {
        return this.getSelectionBoundry('focus');
    },
    getSelectionBoundry: function(which) {
        var selection = window.getSelection(),
            anchorElement = this.canvas.getDocumentElement(selection.anchorNode),
            focusElement = this.canvas.getDocumentElement(selection.focusNode);
        
        if(anchorElement instanceof documentElement.DocumentNodeElement || focusElement instanceof documentElement.DocumentNodeElement)
            return {};

        if(which === 'anchor') {
            return {
                element: anchorElement,
                offset: selection.anchorOffset,
                offsetAtBeginning: selection.anchorOffset === 0,
                offsetAtEnd: anchorElement && anchorElement.getText().length === selection.anchorOffset
            };
        }
        if(which === 'focus') {
            return {
                element: focusElement,
                offset: selection.focusOffset,
                offsetAtBeginning: selection.focusOffset === 0,
                offsetAtEnd: focusElement && focusElement.getText().length === selection.focusOffset
            };
        }
        
        var element,
            offset;

        if(anchorElement.parent().sameNode(focusElement.parent())) {
            var parent = anchorElement.parent(),
                anchorFirst = parent.childIndex(anchorElement) < parent.childIndex(focusElement);
            if(anchorFirst) {
                if(which === 'start') {
                    element = anchorElement;
                    offset = selection.anchorOffset;
                }
                else if(which === 'end') {
                    element = focusElement,
                    offset = selection.focusOffset;
                }
            } else {
                if(which === 'start') {
                    element = focusElement,
                    offset = selection.focusOffset
                }
                else if(which === 'end') {
                    element = anchorElement;
                    offset = selection.anchorOffset;
                }
            }
        } else {
            // TODO: Handle order via https://developer.mozilla.org/en-US/docs/Web/API/Node.compareDocumentPosition
            if(which === 'start') {
                element = anchorElement;
                offset = selection.anchorOffset
            } else {
                element = focusElement;
                offset = selection.focusOffset
            }
        }

        return {
            element: element,
            offset: offset,
            offsetAtBeginning: offset === 0,
            offsetAtEnd: element.getText().length === offset
        }
    }
})

return {
    fromXML: function(xml, publisher) {
        return new Canvas(xml, publisher);
    }
};

});