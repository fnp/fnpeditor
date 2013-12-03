define([
'libs/jquery',
'libs/underscore',
'libs/backbone',
'modules/documentCanvas/canvas/documentElement',
'modules/documentCanvas/canvas/keyboard',
'modules/documentCanvas/canvas/utils',
'modules/documentCanvas/canvas/wlxmlListener'
], function($, _, Backbone, documentElement, keyboard, utils, wlxmlListener) {
    
'use strict';

var TextHandler = function(canvas) {this.canvas = canvas; this.buffer = null};
$.extend(TextHandler.prototype, {
    handle: function(node, text) {
        //console.log('canvas text handler: ' + text);
        this.setText(text, node);
        return;
        if(!this.node) {
            this.node = node;
        }
        if(this.node.sameNode(node)) {
            this._ping(text);
        } else {
            this.flush();
            this.node = node;
            this._ping(text);
        }
    },
    _ping: _.throttle(function(text) {
        this.buffer = text;
        this.flush();
    }, 1000),
    flush: function() {
        if(this.buffer != null) {
            this.setText(this.buffer, this.node);
            this.buffer = null;
        }
    },
    setText: function(text, node) {
        //this.canvas.wlxmlDocument.transform('setText', {node:node, text: text});
        node.transform('smartxml.setText', {text: text});

    }

});


var Canvas = function(wlxmlDocument, publisher) {
    this.eventBus = _.extend({}, Backbone.Events);
    this.wrapper = $('<div>').addClass('canvas-wrapper').attr('contenteditable', true);
    this.wlxmlListener = wlxmlListener.create(this);
    this.loadWlxmlDocument(wlxmlDocument);
    this.publisher = publisher ? publisher : function() {};
    this.textHandler = new TextHandler(this);
};

$.extend(Canvas.prototype, {

    loadWlxmlDocument: function(wlxmlDocument) {
        if(!wlxmlDocument) {
            return false;
        }

        this.wlxmlListener.listenTo(wlxmlDocument);
        this.wlxmlDocument = wlxmlDocument;
        this.reloadRoot();
        this.setupEventHandling();
    },

    reloadRoot: function() {
        var canvasDOM = this.generateCanvasDOM(this.wlxmlDocument.root);
        //var canvasDOM = this.wlxmlDocument.root.getData('canvasElement') ? this.wlxmlDocument.root.getData('canvasElement').dom() : this.generateCanvasDOM(this.wlxmlDocument.root);

        this.wrapper.empty();
        this.wrapper.append(canvasDOM);
        this.d = this.wrapper.children(0);
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
                    observer.observe(canvas.wrapper[0], config);
                    canvas.publisher('contentChanged');

                    var textElement = canvas.getDocumentElement(mutation.target),
                        toSet = mutation.target.data !== utils.unicode.ZWS ? mutation.target.data : '';

                    //textElement.data('wlxmlNode').setText(toSet);
                    //textElement.data('wlxmlNode').document.transform('setText', {node: textElement.data('wlxmlNode'), text: toSet});
                    if(textElement.data('wlxmlNode').getText() != toSet) {
                        canvas.textHandler.handle(textElement.data('wlxmlNode'), toSet);
                    }
                }
            });
        });
        var config = { attributes: false, childList: false, characterData: true, subtree: true, characterDataOldValue: true};
        observer.observe(this.wrapper[0], config);


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

    toggleElementHighlight: function(node, toggle) {
        var element = utils.findCanvasElement(node);
        element.toggleHighlight(toggle);
    },

    createNodeElement: function(params) {
        return documentElement.DocumentNodeElement.create(params, this);
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
        if(!(element instanceof documentElement.DocumentElement)) {
            element = utils.findCanvasElement(element);
        }

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
                this.publisher('currentTextElementSet', textElementToLand.data('wlxmlNode'));
        } else {
            document.getSelection().removeAllRanges();
        }

        if(!(currentNodeElement && currentNodeElement.sameNode(nodeElementToLand))) {
            _markAsCurrent(nodeElementToLand);

            this.publisher('currentNodeElementSet', nodeElementToLand.data('wlxmlNode'));
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