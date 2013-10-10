define([
'libs/jquery',
'libs/underscore',
'libs/backbone',
'modules/documentCanvas/canvas/documentElement',
'modules/documentCanvas/canvas/keyboard',
'modules/documentCanvas/canvas/utils'
], function($, _, Backbone, documentElement, keyboard, utils) {
    
'use strict';

var Canvas = function(wlxmlDocument, publisher) {
    this.eventBus = _.extend({}, Backbone.Events);
    this.wrapper = $('<div>').addClass('canvas-wrapper').attr('contenteditable', true);
    this.loadWlxmlDocument(wlxmlDocument);
    this.publisher = publisher ? publisher : function() {};
};

$.extend(Canvas.prototype, {

    loadWlxmlDocument: function(wlxmlDocument) {
        wlxmlDocument = wlxmlDocument || this.wlxmlDocument;
        if(!wlxmlDocument) {
            return false;
        }
        var canvasDOM = this.generateCanvasDOM(wlxmlDocument.root);

        this.wrapper.empty();
        this.wrapper.append(canvasDOM);
        this.d = this.wrapper.children(0);
        this.setupEventHandling();

        var canvas = this;

        var findCanvasElement = function(node) {
            if(node.nodeType === Node.ELEMENT_NODE) {
                return node.getData('canvasElement');
            }
            if(node.nodeType === Node.TEXT_NODE) {
                var parent = node.parent(),
                    toret;

                parent.children().forEach(function(child) {
                    if(child.data('wlxmlNode').sameNode(node))
                        toret = child;
                });
                if(toret)
                    return toret;
            }
        }

        if(this.wlxmlDocument !== wlxmlDocument) {
            wlxmlDocument.on('change', function(event) {
                var canvasNode = findCanvasElement(event.meta.node);
                if(event.type === 'nodeAttrChange' && event.meta.attr === 'class') {
                    canvasNode.setWlxmlClass(event.meta.newVal);
                }

            });
        }
        this.wlxmlDocument = wlxmlDocument;
    },

    generateCanvasDOM: function(wlxmlNode) {
        var element = documentElement.DocumentNodeElement.create(wlxmlNode, this);
        return element.dom();
    },

    setupEventHandling: function() {
        var canvas = this;
        this.wrapper.on('keyup keydown keypress', function(e) {
            keyboard.handleKey(e, this);
        }.bind(this));

        this.wrapper.on('click', '[document-node-element], [document-text-element]', function(e) {
            e.stopPropagation();
            canvas.setCurrentElement(canvas.getDocumentElement(e.currentTarget), {caretTo: false});
        });

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if(documentElement.DocumentTextElement.isContentContainer(mutation.target)) {
                    observer.disconnect();
                    if(mutation.target.data === '')
                        mutation.target.data = utils.unicode.ZWS;
                    else if(mutation.oldValue === utils.unicode.ZWS) {
                        mutation.target.data = mutation.target.data.replace(utils.unicode.ZWS, '');
                        canvas._moveCaretToTextElement(canvas.getDocumentElement(mutation.target), 'end');
                    }
                    observer.observe(canvas.d[0], config);
                    canvas.publisher('contentChanged');
                }
            });
        });
        var config = { attributes: false, childList: false, characterData: true, subtree: true, characterDataOldValue: true};
        observer.observe(this.d[0], config);


        this.wrapper.on('mouseover', '[document-node-element], [document-text-element]', function(e) {
            var el = canvas.getDocumentElement(e.currentTarget);
            if(!el)
                return;
            e.stopPropagation();
            if(el instanceof documentElement.DocumentTextElement)
                el = el.parent();
            el.toggleLabel(true);
        });
        this.wrapper.on('mouseout', '[document-node-element], [document-text-element]', function(e) {
            var el = canvas.getDocumentElement(e.currentTarget);
            if(!el)
                return;
            e.stopPropagation();
            if(el instanceof documentElement.DocumentTextElement)
                el = el.parent();
            el.toggleLabel(false);
        });

        this.eventBus.on('elementToggled', function(toggle, element) {
            if(!toggle) {
                canvas.setCurrentElement(element.getPreviousTextElement());
            }
        });
    },

    view: function() {
        return this.wrapper;
    },

    doc: function() {
        if(this.d === null)
            return null;
        return documentElement.DocumentNodeElement.fromHTMLElement(this.d.get(0), this); //{wlxmlTag: this.d.prop('tagName')};
    },

    createNodeElement: function(params) {
        return documentElement.DocumentNodeElement.create(params, this);
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
        
        var wrapperElement = this.createNodeElement({tag: params._with.tag, klass: params._with.klass});
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

    wrapElements: function(params) {
        if(!(params.element1.parent().sameNode(params.element2.parent())))
            return;

        var parent = params.element1.parent(),
            parentChildren = parent.children(),
            wrapper = this.createNodeElement({
                tag: params._with.tag,
                klass: params._with.klass}),
            idx1 = parent.childIndex(params.element1),
            idx2 = parent.childIndex(params.element2);

        if(idx1 > idx2) {
            var tmp = idx1;
            idx1 = idx2;
            idx2 = tmp;
        }

        var insertingMethod, insertingTarget;
        if(idx1 === 0) {
            insertingMethod = 'prepend';
            insertingTarget = parent;
        } else {
            insertingMethod = 'after';
            insertingTarget = parentChildren[idx1-1];
        }

        for(var i = idx1; i <= idx2; i++) {
            wrapper.append(parentChildren[i].detach());
        }

        insertingTarget[insertingMethod](wrapper);
        return wrapper;
    },

    getSiblingParents: function(params) {
        var parents1 = [params.element1].concat(params.element1.parents()).reverse(),
            parents2 = [params.element2].concat(params.element2.parents()).reverse(),
            noSiblingParents = null;

        if(parents1.length === 0 || parents2.length === 0 || !(parents1[0].sameNode(parents2[0])))
            return noSiblingParents;

        var i;
        for(i = 0; i < Math.min(parents1.length, parents2.length); i++) {
            if(parents1[i].sameNode(parents2[i]))
                continue;
            break;
        }
        return {element1: parents1[i], element2: parents2[i]};
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

    
    getCurrentNodeElement: function() {
        return this.getDocumentElement(this.wrapper.find('.current-node-element').parent()[0]);
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
                element._container().addClass('current-node-element');
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
        var parent = $('<div>'),
            parts = this.doc().toXML(0);
        parent.append(parts);
        return parent.html();
    }
});

$.extend(Canvas.prototype.list, {
    create: function(params) {
        if(!(params.element1.parent().sameNode(params.element2.parent())))
            return false;
            
        var parent = params.element1.parent(),
            canvas = params.element1.canvas;
        
        if(parent.childIndex(params.element1) > parent.childIndex(params.element2)) {
            var tmp = params.element1;
            params.element1 = params.element2;
            params.element2 = tmp;
        }
        
        var elementsToWrap = [];
        
        var place = 'before';
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
        
        var listElement = canvas.createNodeElement({tag: 'div', klass: 'list-items' + (params.type === 'enum' ? '-enum' : '')});
        var toret;
        if(parent.is('list')) {
            var item = listElement.wrapWithNodeElement({tag: 'div', klass: 'item'});
            item.exec('toggleBullet', false);
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
            canvas = params.element1.canvas,
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
            var secondList = canvas.createNodeElement({tag: 'div', klass:'list-items'}),
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
        
        if((!anchorElement) || (anchorElement instanceof documentElement.DocumentNodeElement) || (!focusElement) || focusElement instanceof documentElement.DocumentNodeElement)
            return {};

        if(which === 'anchor') {
            return {
                element: anchorElement,
                offset: selection.anchorOffset,
                offsetAtBeginning: selection.anchorOffset === 0,
                offsetAtEnd: selection.anchorNode.data.length === selection.anchorOffset
            };
        }
        if(which === 'focus') {
            return {
                element: focusElement,
                offset: selection.focusOffset,
                offsetAtBeginning: selection.focusOffset === 0,
                offsetAtEnd: selection.focusNode.data.length === selection.focusOffset
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
                    offset = selection.anchorOffset
                }
                else if(which === 'end') {
                    element = focusElement,
                    offset = selection.focusOffset
                }
            } else {
                if(which === 'start') {
                    element = focusElement,
                    offset = selection.focusOffset
                }
                else if(which === 'end') {
                    element = anchorElement;
                    offset = selection.anchorOffset
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

        var nodeLen = (element.sameNode(focusElement) ? selection.focusNode : selection.anchorNode).length;
        return {
            element: element,
            offset: offset,
            offsetAtBeginning: offset === 0,
            offsetAtEnd: nodeLen === offset
        }
    }
})

return {
    fromXMLDocument: function(wlxmlDocument, publisher) {
        return new Canvas(wlxmlDocument, publisher);
    }
};

});