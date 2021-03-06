define([
'libs/jquery',
'libs/underscore',
'libs/backbone',
'fnpjs/logging/logging',
'views/menu/menu',
'modules/documentCanvas/canvas/documentElement',
'modules/documentCanvas/canvas/keyboard',
'modules/documentCanvas/canvas/utils',
'modules/documentCanvas/canvas/wlxmlListener',
'modules/documentCanvas/canvas/elementsRegister',
'modules/documentCanvas/canvas/genericElement',
'modules/documentCanvas/canvas/nullElement',
'modules/documentCanvas/canvas/gutter',
'modules/documentCanvas/canvas/selection',
'modules/documentCanvas/canvas/keyEvent',
'libs/text!./canvas.html'
], function($, _, Backbone, logging, Menu, documentElement, keyboard, utils, wlxmlListener, ElementsRegister, genericElement, nullElement, gutter, selection, keyEvent, canvasTemplate) {

'use strict';
/* global document:false, window:false, Node:false, gettext */

var logger = logging.getLogger('canvas');

var TextHandler = function(canvas) {this.canvas = canvas; this.buffer = null;};
$.extend(TextHandler.prototype, {
    handle: function(node, text) {
        this.setText(text, node);
        // return;
        // if(!this.node) {
        //     this.node = node;
        // }
        // if(this.node.sameNode(node)) {
        //     this._ping(text);
        // } else {
        //     this.flush();
        //     this.node = node;
        //     this._ping(text);
        // }
    },
    _ping: _.throttle(function(text) {
        this.buffer = text;
        this.flush();
    }, 1000),
    flush: function() {
        if(this.buffer !== null) {
            this.setText(this.buffer, this.node);
            this.buffer = null;
        }
    },
    setText: function(text, node) {
        //this.canvas.wlxmlDocument.transform('setText', {node:node, text: text});
        node.document.transaction(function() {
            node.setText(text);
        }, {
            metadata:{
                description: gettext('Changing text')
            }
        });

    }

});


var Canvas = function(wlxmlDocument, elements, metadata, sandbox) {
    this.metadata = metadata || {};
    this.sandbox = sandbox;
    this.elementsRegister = this.createElementsRegister();

    elements = [
        {tag: 'section', klass: null, prototype: genericElement},
        {tag: 'div', klass: null, prototype: genericElement},
        {tag: 'header', klass: null, prototype: genericElement},
        {tag: 'span', klass: null, prototype: genericElement},
        {tag: 'aside', klass: null, prototype: genericElement}
    ].concat(elements || []);

    (elements).forEach(function(elementDesc) {
        this.elementsRegister.register(elementDesc);
    }.bind(this));
    this.eventBus = _.extend({}, Backbone.Events);
    
    this.dom = $(canvasTemplate);
    this.rootWrapper = this.dom.find('.root-wrapper');
    

    this.gutter = gutter.create();
    this.gutterView = new gutter.GutterView(this.gutter);
    this.dom.find('.view-row').append(this.gutterView.dom);
    
    this.wlxmlListener = wlxmlListener.create(this);
    this.loadWlxmlDocument(wlxmlDocument);
    this.setupEventHandling();
    this.textHandler = new TextHandler(this);
};

$.extend(Canvas.prototype, Backbone.Events, {

    createElementType: function(elementPrototype) {
        /* TODO: reconcile this with ElementsRegister behavior */
        var Constructor = function() {
            documentElement.DocumentNodeElement.apply(this, Array.prototype.slice.call(arguments, 0));
        };
        Constructor.prototype = elementPrototype;
        return Constructor;
    },

    getElementOffset: function(element) {
        return element.dom.offset().top - this.dom.offset().top;
    },

    loadWlxmlDocument: function(wlxmlDocument) {
        if(!wlxmlDocument) {
            return false;
        }

        this.wlxmlListener.listenTo(wlxmlDocument);
        this.wlxmlDocument = wlxmlDocument;
        this.reloadRoot();
    },

    createElement: function(wlxmlNode, register, useRoot) {
        var Factory;
        register = register || this.elementsRegister;
        if(wlxmlNode.nodeType === Node.TEXT_NODE) {
            Factory = documentElement.DocumentTextElement;
        } else {
            Factory = register.getElement({tag: wlxmlNode.getTagName(), klass: wlxmlNode.getClass()});
        }
        if(!Factory && useRoot) {
            Factory = this.elementsRegister.getElement({tag: wlxmlNode.getTagName(), klass: wlxmlNode.getClass()});
            if(!Factory) {
                Factory = documentElement.DocumentNodeElement;
            }
        }

        if(Factory) {
            return new Factory(wlxmlNode, this);
        }
    },

    createElementsRegister: function() {
        return new ElementsRegister(documentElement.DocumentNodeElement, nullElement);
    },

    getDocumentElement: function(htmlElement) {
        /* globals HTMLElement, Text */
        if(!htmlElement || !(htmlElement instanceof HTMLElement || htmlElement instanceof Text)) {
            return null;
        }
        var $element = $(htmlElement);
        if(htmlElement.nodeType === Node.ELEMENT_NODE && $element.attr('document-node-element') !== undefined) {
            return $element.data('canvas-element');
        }

        if(htmlElement.nodeType === Node.TEXT_NODE && $element.parent().attr('document-text-element') !== undefined) {
            $element = $element.parent();
        }

        if($element.attr('document-text-element') !== undefined || (htmlElement.nodeType === Node.TEXT_NODE && $element.parent().attr('document-text-element') !== undefined)) {
            //return DocumentTextElement.fromHTMLElement(htmlElement, canvas);
            return $element.data('canvas-element');
        }
    },

    reloadRoot: function() {
        if(this.rootElement) {
            this.rootElement.detach();
        }
        this.rootElement = this.createElement(this.wlxmlDocument.root);
        this.rootWrapper.append(this.rootElement.dom);
    },

    triggerKeyEvent: function(keyEvent, selection) {
        selection = selection || this.getSelection();
        if(selection && (
            (selection.type === 'caret' || selection.type === 'textSelection') && selection.toDocumentFragment().isValid()
            || selection.type == 'nodeSelection')) {
            keyboard.handleKeyEvent(keyEvent, selection);
        }
    },

    createAction: function(fqName, config) {
        return this.sandbox.createAction(fqName, config);
    },

    setupEventHandling: function() {
        var canvas = this;

        /* globals document */
        $(document.body).on('keydown', function(e) {
            canvas.triggerKeyEvent(keyEvent.fromNativeEvent(e));
        });

        this.rootWrapper.on('mouseup', function() {
            canvas.triggerSelectionChanged();
        });

        var mouseDown;
        this.rootWrapper.on('mousedown', '[document-node-element], [document-text-element]', function(e) {
            mouseDown = e.target;
            canvas.rootWrapper.find('[contenteditable]').attr('contenteditable', null);
        });

        this.rootWrapper.on('click', '[document-node-element], [document-text-element]', function(e) {
            var position, element;
            e.stopPropagation();
            if(e.originalEvent.detail === 3) {
                e.preventDefault();
                canvas._moveCaretToTextElement(canvas.getDocumentElement(e.currentTarget), 'whole');
            } else {
                if(mouseDown === e.target) {
                    element = canvas.getDocumentElement(e.target);
                    if(element && element.wlxmlNode.nodeType === Node.ELEMENT_NODE) {
                        if(element.getVerticallyFirstTextElement && !element.getVerticallyFirstTextElement({considerChildren: false})) {
                            canvas.setCurrentElement(element);
                            return;
                        }
                    }
                    if(window.getSelection().isCollapsed) {
                        position = utils.caretPositionFromPoint(e.clientX, e.clientY);
                        canvas.setCurrentElement(canvas.getDocumentElement(position.textNode), {caretTo: position.offset});
                    }
                }
            }
        });

        this.rootWrapper.on('contextmenu', function(e) {
            var el = canvas.getDocumentElement(e.target);
            
            if(!el) {
                return;
            }

            e.preventDefault();
            this.showContextMenu(el, {x: e.clientX, y: e.clientY});
        }.bind(this));

        this.rootWrapper.on('paste', function(e) {
            e.preventDefault();

            var clipboardData = e.originalEvent.clipboardData;
            if(!clipboardData || !clipboardData.getData) {
                return; // TODO: alert
            }

            var text = clipboardData.getData('text/plain').replace(/\r?\n|\r/g, ' '),
                cursor = canvas.getCursor(),
                element = cursor.getPosition().element,
                lhs, rhs;
            
            if(element && cursor.isWithinElement()) {
                lhs = element.getText().substr(0, cursor.getSelectionStart().offset);
                rhs = element.getText().substr(cursor.getSelectionEnd().offset);
                element.setText(lhs+text+rhs);
                canvas.setCurrentElement(element, {caretTo: lhs.length + text.length});
            } else {
                /* jshint noempty:false */
                // TODO: alert
            }
        });

        /* globals MutationObserver */
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if(canvas.dom[0].contains(mutation.target) && documentElement.DocumentTextElement.isContentContainer(mutation.target)) {
                    observer.disconnect();
                    if(mutation.target.data === '') {
                        mutation.target.data = utils.unicode.ZWS;
                    }
                    if(mutation.target.data === mutation.oldValue) {
                        return; // shouldn't happen, but better be safe
                    }
                    if(mutation.oldValue === utils.unicode.ZWS) {
                        mutation.target.data = mutation.target.data.replace(utils.unicode.ZWS, '');
                        canvas._moveCaretToTextElement(canvas.getDocumentElement(mutation.target), 'end');
                    }
                    observer.observe(canvas.dom[0], config);

                    var textElement = canvas.getDocumentElement(mutation.target),
                        toSet = mutation.target.data !== utils.unicode.ZWS ? mutation.target.data : '';

                    //textElement.data('wlxmlNode').setText(toSet);
                    //textElement.data('wlxmlNode').document.transform('setText', {node: textElement.data('wlxmlNode'), text: toSet});
                    if(textElement.wlxmlNode.getText() !== toSet) {
                        canvas.textHandler.handle(textElement.wlxmlNode, toSet);
                    }
                }
            });
        });
        var config = { attributes: false, childList: false, characterData: true, subtree: true, characterDataOldValue: true};
        observer.observe(this.rootWrapper[0], config);


        var hoverHandler = function(e) {
            var el = canvas.getDocumentElement(e.currentTarget),
                expose = {
                    mouseover: true,
                    mouseout: false
                };
            if(!el) {
                return;
            }
            e.stopPropagation();
            if(el instanceof documentElement.DocumentTextElement) {
                el = el.parent();
            }
            el.updateState({exposed:expose[e.type]});
        };

        this.rootWrapper.on('mouseover', '[document-node-element], [document-text-element]', hoverHandler);
        this.rootWrapper.on('mouseout', '[document-node-element], [document-text-element]', hoverHandler);

        this.eventBus.on('elementToggled', function(toggle, element) {
            if(!toggle) {
                canvas.setCurrentElement(canvas.getPreviousTextElement(element));
            }
        });
    },

    view: function() {
        return this.dom;
    },

    doc: function() {
        return this.rootElement;
    },

    toggleElementHighlight: function(node, toggle) {
        var element = utils.getElementForNode(node);
        element.updateState({exposed: toggle});
    },

    getCursor: function() {
        return new Cursor(this);
    },

    
    getCurrentNodeElement: function() {
        return this.currentNodeElement;
    },

    getCurrentTextElement: function() {
        var htmlElement = this.rootWrapper.find('.current-text-element')[0];
        if(htmlElement) {
            return this.getDocumentElement(htmlElement);
        }
    },

    getPreviousTextElement: function(relativeToElement, includeInvisible) {
        return this.getNearestTextElement('above', relativeToElement, includeInvisible);
    },

    getNextTextElement: function(relativeToElement, includeInvisible) {
        return this.getNearestTextElement('below', relativeToElement, includeInvisible);
    },

    getNearestTextElement: function(direction, relativeToElement, includeInvisible) {
        includeInvisible = includeInvisible !== undefined ? includeInvisible : false;
        var selector = '[document-text-element]' + (includeInvisible ? '' : ':visible');
        return this.getDocumentElement(utils.nearestInDocumentOrder(selector, direction, relativeToElement.dom[0]));
    },

    contains: function(element) {
        return element && element.dom && element.dom.parents().index(this.rootWrapper) !== -1;
    },

    triggerSelectionChanged: function() {
        var s = this.getSelection(),
            f;
        if(!s) {
            return;
        }
        this.trigger('selectionChanged', s);
        f = s.toDocumentFragment();

        if(f && f instanceof f.RangeFragment) {
            if(this.currentNodeElement) {
                this.currentNodeElement.updateState({active: false});
                this.currentNodeElement = null;
            }
        }
    },

    getSelection: function() {
        return selection.fromNativeSelection(this);
    },

    select: function(fragment) {
        if(fragment instanceof this.wlxmlDocument.RangeFragment) {
            this.setCurrentElement(fragment.endNode, {caretTo: fragment.endOffset});
        } else if(fragment instanceof this.wlxmlDocument.NodeFragment) {
            var params = {
                caretTo: fragment instanceof this.wlxmlDocument.CaretFragment ? fragment.offset : 'start'
            };
            this.setCurrentElement(fragment.node, params);
        } else {
            logger.debug('Fragment not supported');
        }
    },

    setSelection: function(selection) {
        this.select(this, selection.toDocumentFragment());
    },

    createSelection: function(params) {
        return selection.fromParams(this, params);
    },
    setCurrentElement: function(element, params) {
        if(!element) {
            logger.debug('Invalid element passed to setCurrentElement: ' + element);
            return;
        }

        if(!(element instanceof documentElement.DocumentElement)) {
            element = utils.getElementForNode(element);
        }

        if(!element || !this.contains(element)) {
            logger.warning('Cannot set current element: element doesn\'t exist on canvas');
            return;
        }

        params = _.extend({caretTo: 'end'}, params);
        var findFirstDirectTextChild = function(e, nodeToLand) {
            var byBrowser = this.getCursor().getPosition().element;
            if(byBrowser && byBrowser.parent().sameNode(nodeToLand)) {
                return byBrowser;
            }
            return _.isFunction(e.getVerticallyFirstTextElement) ? e.getVerticallyFirstTextElement({considerChildren: false}) : null;
        }.bind(this);
        var _markAsCurrent = function(element) {
            if(element instanceof documentElement.DocumentTextElement) {
                this.rootWrapper.find('.current-text-element').removeClass('current-text-element');
                element.dom.addClass('current-text-element');
            } else {
                if(this.currentNodeElement) {
                    this.currentNodeElement.updateState({active: false});
                }
                element.updateState({active: true});
                this.currentNodeElement = element;
            }
        }.bind(this);


        var isTextElement = element instanceof documentElement.DocumentTextElement,
            nodeElementToLand = isTextElement ? element.parent() : element,
            textElementToLand = isTextElement ? element : findFirstDirectTextChild(element, nodeElementToLand),
            currentTextElement = this.getCurrentTextElement(),
            currentNodeElement = this.getCurrentNodeElement();

        if(currentTextElement && !(currentTextElement.sameNode(textElementToLand))) {
            this.rootWrapper.find('.current-text-element').removeClass('current-text-element');
        }

        if(textElementToLand) {
            _markAsCurrent(textElementToLand);
            if((params.caretTo || params.caretTo === 0) || !textElementToLand.sameNode(this.getCursor().getPosition().element)) {
                this._moveCaretToTextElement(textElementToLand, params.caretTo); // as method on element?
            }
        } else {
            document.getSelection().removeAllRanges();
        }

        if(!(currentNodeElement && currentNodeElement.sameNode(nodeElementToLand))) {
            _markAsCurrent(nodeElementToLand);
        }
        this.triggerSelectionChanged();
    },

    _moveCaretToTextElement: function(element, where) {
        var range = document.createRange(),
            node = element.dom.contents()[0];

        if(typeof where !== 'number') {
            range.selectNodeContents(node);
        } else {
            range.setStart(node, Math.min(node.data.length, where));
        }
        
        if(where !== 'whole') {
            var collapseArg = true;
            if(where === 'end') {
                collapseArg = false;
            }
            range.collapse(collapseArg);
        }
        var selection = document.getSelection();

        $(node).parent().attr('contenteditable', true);
        selection.removeAllRanges();
        selection.addRange(range);
        $(node).parent().focus(); // FF requires this for caret to be put where range colllapses, Chrome doesn't.
    },

    setCursorPosition: function(position) {
        if(position.element) {
            this._moveCaretToTextElement(position.element, position.offset);
        }
    },
    showContextMenu: function(element, coors) {
        var menu = new Menu();

        while(element) {
            (element.contextMenuActions || []).forEach(menu.addAction.bind(menu));
            element = element.parent();
        }
        if(menu.actions.length) {
            menu.updateContextParam('fragment', this.getSelection().toDocumentFragment());
            this.sandbox.showContextMenu(menu, {x: coors.x, y: coors.y});
        }
    }
});


var Cursor = function(canvas) {
    this.canvas = canvas;
    this.selection = window.getSelection();
};

$.extend(Cursor.prototype, {
    sameAs: function(other) {
        var same = true;
        if(!other) {
            return false;
        }

        ['focusNode', 'focusOffset', 'anchorNode', 'anchorOffset'].some(function(prop) {
            same = same && this.selection[prop] === other.selection[prop];
            if(!same) {
                return true; // break
            }
        }.bind(this));

        return same;
    },
    isSelecting: function() {
        var selection = window.getSelection();
        return !selection.isCollapsed;
    },
    isSelectingWithinElement: function() {
        return this.isSelecting() && this.getSelectionStart().element.sameNode(this.getSelectionEnd().element);
    },
    isWithinElement: function() {
        return !this.isSelecting() || this.isSelectingWithinElement();
    },
    isSelectingSiblings: function() {
        return this.isSelecting() && this.getSelectionStart().element.parent().sameNode(this.getSelectionEnd().element.parent());
    },
    getPosition: function() {
        return this.getSelectionAnchor();
    },
    getSelectionStart: function() {
        return this.getSelectionBoundary('start');
    },
    getSelectionEnd: function() {
        return this.getSelectionBoundary('end');
    },
    getSelectionAnchor: function() {
        return this.getSelectionBoundary('anchor');
    },
    getSelectionFocus: function() {
        return this.getSelectionBoundary('focus');
    },
    getSelectionBoundary: function(which) {
        /* globals window */
        var selection = window.getSelection(),
            anchorElement = this.canvas.getDocumentElement(selection.anchorNode),
            focusElement = this.canvas.getDocumentElement(selection.focusNode);
        
        if((!anchorElement) || (anchorElement instanceof documentElement.DocumentNodeElement) || (!focusElement) || focusElement instanceof documentElement.DocumentNodeElement) {
            return {};
        }

        if(which === 'anchor') {
            return {
                element: anchorElement,
                offset: selection.anchorOffset,
                offsetAtBeginning: selection.anchorOffset === 0 || anchorElement.getText() === '',
                offsetAtEnd: selection.anchorNode.data.length === selection.anchorOffset || anchorElement.getText() === ''
            };
        }
        if(which === 'focus') {
            return {
                element: focusElement,
                offset: selection.focusOffset,
                offsetAtBeginning: selection.focusOffset === 0 || focusElement.getText() === '',
                offsetAtEnd: selection.focusNode.data.length === selection.focusOffset || focusElement.getText() === '',
            };
        }
        
        var getPlaceData = function(anchorFirst) {
            var element, offset;
            if(anchorFirst) {
                if(which === 'start') {
                    element = anchorElement;
                    offset = selection.anchorOffset;
                }
                else if(which === 'end') {
                    element = focusElement;
                    offset = selection.focusOffset;
                }
            } else {
                if(which === 'start') {
                    element = focusElement;
                    offset = selection.focusOffset;
                }
                else if(which === 'end') {
                    element = anchorElement;
                    offset = selection.anchorOffset;
                }
            }
            return {element: element, offset: offset};
        };

        var anchorFirst, placeData, parent;

        if(anchorElement.parent().sameNode(focusElement.parent())) {
            parent = anchorElement.parent();
            if(selection.anchorNode === selection.focusNode) {
                anchorFirst = selection.anchorOffset <= selection.focusOffset;
            } else {
                anchorFirst = (parent.getFirst(anchorElement, focusElement) === anchorElement);
            }
            placeData = getPlaceData(anchorFirst);
        } else {
            /*jshint bitwise: false*/
            anchorFirst = selection.anchorNode.compareDocumentPosition(selection.focusNode) & Node.DOCUMENT_POSITION_FOLLOWING;
            placeData = getPlaceData(anchorFirst);
        }

        var nodeLen = (placeData.element.sameNode(focusElement) ? selection.focusNode : selection.anchorNode).length;
        return {
            element: placeData.element,
            offset: placeData.offset,
            offsetAtBeginning: placeData.offset === 0 || focusElement.getText() === '',
            offsetAtEnd: nodeLen === placeData.offset || focusElement.getText() === ''
        };
    }
});

return {
    fromXMLDocument: function(wlxmlDocument, elements, metadata, sandbox) {
        return new Canvas(wlxmlDocument, elements, metadata, sandbox);
    }
};

});