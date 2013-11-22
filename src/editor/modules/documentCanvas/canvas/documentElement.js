define([
'libs/jquery',
'libs/underscore',
'modules/documentCanvas/canvas/utils',
'modules/documentCanvas/canvas/widgets',
'modules/documentCanvas/canvas/wlxmlManagers'
], function($, _, utils, widgets, wlxmlManagers) {
    
'use strict';


// DocumentElement represents a text or an element node from WLXML document rendered inside Canvas
var DocumentElement = function(htmlElement, canvas) {
    if(arguments.length === 0)
        return;
    this.canvas = canvas;
    this._setupDOMHandler(htmlElement);
}


var elementTypeFromWlxmlNode = function(wlxmlNode) {
    return wlxmlNode.nodeType === Node.TEXT_NODE ? DocumentTextElement : DocumentNodeElement;
}

$.extend(DocumentElement, {
    create: function(node, canvas) {
        return elementTypeFromWlxmlNode(node).create(node, canvas);
    },

    createDOM: function(wlxmlNode) {
        return elementTypeFromParams(wlxmlNode).createDOM(params);
    },

    fromHTMLElement: function(htmlElement, canvas) {
        var $element = $(htmlElement);
        if(htmlElement.nodeType === Node.ELEMENT_NODE && $element.attr('document-node-element') !== undefined)
            return DocumentNodeElement.fromHTMLElement(htmlElement, canvas);
        if($element.attr('document-text-element') !== undefined || (htmlElement.nodeType === Node.TEXT_NODE && $element.parent().attr('document-text-element') !== undefined))
            return DocumentTextElement.fromHTMLElement(htmlElement, canvas);
        return undefined;
    }
});

$.extend(DocumentElement.prototype, {
    _setupDOMHandler: function(htmlElement) {
        this.$element = $(htmlElement);
    },
    bound: function() {
        return $.contains(document.documentElement, this.dom()[0]);
    },
    dom: function() {
        return this.$element;
    },
    data: function() {
        var dom = this.dom(),
            args = Array.prototype.slice.call(arguments, 0);
        if(args.length === 2 && args[1] === undefined)
            return dom.removeData(args[0]);
        return dom.data.apply(dom, arguments);
    },
    parent: function() {
        var parents = this.$element.parents('[document-node-element]');
        if(parents.length)
            return DocumentElement.fromHTMLElement(parents[0], this.canvas);
        return null;
    },

    parents: function() {
        var parents = [],
            parent = this.parent();
        while(parent) {
            parents.push(parent);
            parent = parent.parent();
        }
        return parents;
    },

    sameNode: function(other) {
        return other && (typeof other === typeof this) && other.dom()[0] === this.dom()[0];
    },

    wrapWithNodeElement: function(wlxmlNode) {
        var wrapper = DocumentNodeElement.create({tag: wlxmlNode.tag, klass: wlxmlNode.klass}, this);
        this.dom().replaceWith(wrapper.dom());
        wrapper.append(this);
        return wrapper;
    },

    markAsCurrent: function() {
        this.canvas.markAsCurrent(this);
    },

    getVerticallyFirstTextElement: function() {
        var toret;
        this.children().some(function(child) {
            if(!child.isVisible())
                return false; // continue
            if(child instanceof DocumentTextElement) {
                toret = child;
                return true; // break
            } else {
                toret = child.getVerticallyFirstTextElement();
                if(toret)
                    return true; // break
            }
        });
        return toret;
    },

    getPreviousTextElement: function(includeInvisible) {
        return this.getNearestTextElement('above', includeInvisible);
    },

    getNextTextElement: function(includeInvisible) {
        return this.getNearestTextElement('below', includeInvisible);
    },

    getNearestTextElement: function(direction, includeInvisible) {
        includeInvisible = includeInvisible !== undefined ? includeInvisible : false;
        var selector = '[document-text-element]' + (includeInvisible ? '' : ':visible');
        return this.canvas.getDocumentElement(utils.nearestInDocumentOrder(selector, direction, this.dom()[0]));
    },

    isVisible: function() {
        return this instanceof DocumentTextElement || this.getWlxmlTag() !== 'metadata';
    },

    isInsideList: function() {
        return this.parents().some(function(parent) {
            return parent.is('list');
        });
    },

    exec: function(method) {
        var manager = this.data('_wlxmlManager');
        if(manager[method])
            return manager[method].apply(manager, Array.prototype.slice.call(arguments, 1));
    }
});


// DocumentNodeElement represents an element node from WLXML document rendered inside Canvas
var DocumentNodeElement = function(htmlElement, canvas) {
    DocumentElement.call(this, htmlElement, canvas);
};

$.extend(DocumentNodeElement, {
    create: function(wlxmlNode, canvas) {
        return this.fromHTMLElement(this.createDOM(wlxmlNode, canvas)[0], canvas);
    },

    fromHTMLElement: function(htmlElement, canvas) {
        return new this(htmlElement, canvas);
    },

    createDOM: function(wlxmlNode, canvas) {
        var dom = $('<div>')
                .attr('document-node-element', ''),
            widgetsContainer = $('<div>')
                .addClass('canvas-widgets')
                .attr('contenteditable', false),
            container = $('<div>')
                .attr('document-element-content', '');
        
        dom.append(widgetsContainer, container);
        // Make sure widgets aren't navigable with arrow keys
        widgetsContainer.find('*').add(widgetsContainer).attr('tabindex', -1);

        var element = this.fromHTMLElement(dom[0], canvas);

        element.data('wlxmlNode', wlxmlNode);
        wlxmlNode.setData('canvasElement', element);

        element.setWlxml({tag: wlxmlNode.getTagName(), klass: wlxmlNode.getClass()});

        wlxmlNode.contents().forEach((function(node) {
            container.append(DocumentElement.create(node).dom());
        }).bind(this));

        return dom;
    }

});

var manipulate = function(e, params, action) {
    var element;
    if(params instanceof DocumentElement) {
        element = params;
    } else {
        element = DocumentElement.create(params);
    }
    var target = (action === 'append' || action === 'prepend') ? e._container() : e.dom();
    target[action](element.dom());
    return element;
};

DocumentNodeElement.prototype = new DocumentElement();


$.extend(DocumentNodeElement.prototype, {
    _container: function() {
        return this.dom().children('[document-element-content]');
    },
    detach: function() {
        var parent = this.parent();
        if(!parent)
            return;

        var parentChildren = parent.children(),
            myIdx = parent.childIndex(this);

        if(myIdx > 0 && myIdx < parentChildren.length) {
            if((parentChildren[myIdx-1] instanceof DocumentTextElement) && (parentChildren[myIdx+1] instanceof DocumentTextElement)) {
                parentChildren[myIdx-1].appendText(parentChildren[myIdx+1].getText());
                parentChildren[myIdx+1].detach();
            }
        }
        this.dom().detach();
        this.canvas = null;
        return this;
    },
    unwrapContents: function() {
        var parent = this.parent();
        if(!parent)
            return;

        var parentChildren = parent.children(),
            myChildren = this.children(),
            myIdx = parent.childIndex(this);

        if(myChildren.length === 0)
            return this.detach();

        var moveLeftRange, moveRightRange, leftMerged;

        if(myIdx > 0 && (parentChildren[myIdx-1] instanceof DocumentTextElement) && (myChildren[0] instanceof DocumentTextElement)) {
            parentChildren[myIdx-1].appendText(myChildren[0].getText());
            myChildren[0].detach();
            moveLeftRange = true;
            leftMerged = true;
        } else {
            leftMerged = false;
        }

        if(!(leftMerged && myChildren.length === 1)) {
            if(myIdx < parentChildren.length - 1 && (parentChildren[myIdx+1] instanceof DocumentTextElement) && (myChildren[myChildren.length-1] instanceof DocumentTextElement)) {
                parentChildren[myIdx+1].prependText(myChildren[myChildren.length-1].getText());
                myChildren[myChildren.length-1].detach();
                moveRightRange = true;
            }
        }

        var childrenLength = this.children().length;
        this.children().forEach(function(child) {
            this.before(child);
        }.bind(this));

        this.detach();

        return {
            element1: parent.children()[myIdx + (moveLeftRange ? -1 : 0)],
            element2: parent.children()[myIdx + childrenLength-1 + (moveRightRange ? 1 : 0)]
        };
    },
    append: function(params) {
        if(params.tag !== 'span')
            this.data('orig-end', undefined);
        return manipulate(this, params, 'append');
    },
    prepend: function(params) {
        return manipulate(this, params, 'prepend');
    },
    before: function(params) {
        return manipulate(this, params, 'before');

    },
    after: function(params) {
        return manipulate(this, params, 'after');
    },
    children: function() {
        var toret = [];
        if(this instanceof DocumentTextElement)
            return toret;


        var elementContent = this._container().contents();
        var element = this;
        elementContent.each(function(idx) {
            var childElement = DocumentElement.fromHTMLElement(this, element.canvas);
            if(childElement === undefined)
                return true;
            if(idx === 0 && elementContent.length > 1 && elementContent[1].nodeType === Node.ELEMENT_NODE && (childElement instanceof DocumentTextElement) && $.trim($(this).text()) === '')
                return true;
            if(idx > 0 && childElement instanceof DocumentTextElement) {
                if(toret[toret.length-1] instanceof DocumentNodeElement && $.trim($(this).text()) === '')
                    return true;
            }
            toret.push(childElement);
        });
        return toret;
    },
    childIndex: function(child) {
        var children = this.children(),
            toret = null;
        children.forEach(function(c, idx) {
            if(c.sameNode(child)) {
                toret = idx;
                return false;
            }
        });
        return toret;
    },
    getWlxmlTag: function() {
        return this._container().attr('wlxml-tag');
    },
    setWlxmlTag: function(tag) {
        if(tag === this.getWlxmlTag())
            return;

        this._container().attr('wlxml-tag', tag);
        if(!this.__updatingWlxml)
            this._updateWlxmlManager();
    },
    getWlxmlClass: function() {
        var klass = this._container().attr('wlxml-class');
        if(klass)
            return klass.replace(/-/g, '.');
        return undefined;
    },
    setWlxmlClass: function(klass) {
        if(klass === this.getWlxmlClass())
            return;
        if(klass)
            this._container().attr('wlxml-class', klass.replace(/\./g, '-'));
        else
            this._container().removeAttr('wlxml-class');
        if(!this.__updatingWlxml)
            this._updateWlxmlManager();
    },
    setWlxml: function(params) {
        this.__updatingWlxml = true;
        if(params.tag !== undefined)
            this.setWlxmlTag(params.tag);
        if(params.klass !== undefined)
            this.setWlxmlClass(params.klass);
        this._updateWlxmlManager();
        this.__updatingWlxml = false;
    },
    _updateWlxmlManager: function() {
        var manager = wlxmlManagers.getFor(this);
        this.data('_wlxmlManager', manager);
        manager.setup();
    },
    is: function(what) {
        if(what === 'list' && _.contains(['list.items', 'list.items.enum'], this.getWlxmlClass()))
            return true;
        return false;
    },
    toggleLabel: function(toggle) {
        var displayCss = toggle ? 'inline-block' : 'none';
        var label = this.dom().children('.canvas-widgets').find('.canvas-widget-label');
        label.css('display', displayCss);
        this.toggleHighlight(toggle);
    },

    toggleHighlight: function(toggle) {
        this._container().toggleClass('highlighted-element', toggle);
    },

    toggle: function(toggle) {
        var mng = this.data('_wlxmlManager');
        if(mng) {
            mng.toggle(toggle);
        }
    }
});


// DocumentNodeElement represents a text node from WLXML document rendered inside Canvas
var DocumentTextElement = function(htmlElement, canvas) {
    DocumentElement.call(this, htmlElement, canvas);
};

$.extend(DocumentTextElement, {
    createDOM: function(wlxmlTextNode) {
        var dom = $('<div>')
            .attr('document-text-element', '')
            .text(wlxmlTextNode.getText() || utils.unicode.ZWS),
        element = this.fromHTMLElement(dom[0], this);
        element.data('wlxmlNode', wlxmlTextNode);
        return dom;
    },

    create: function(wlxmlTextNode, canvas) {
        return this.fromHTMLElement(this.createDOM(wlxmlTextNode)[0]);
    },

    fromHTMLElement: function(htmlElement, canvas) {
        return new this(htmlElement, canvas);
    },
    isContentContainer: function(htmlElement) {
        return htmlElement.nodeType === Node.TEXT_NODE && $(htmlElement).parent().is('[document-text-element]');
    }
});

DocumentTextElement.prototype = new DocumentElement();

$.extend(DocumentTextElement.prototype, {
    _setupDOMHandler: function(htmlElement) {
        var $element = $(htmlElement);
        if(htmlElement.nodeType === Node.TEXT_NODE)
            this.$element = $element.parent();
        else
            this.$element = $element;
    },
    detach: function() {
        this.dom().detach();
        this.canvas = null;
        return this;
    },
    setText: function(text) {
        this.dom().contents()[0].data = text;
    },
    appendText: function(text) {
        this.dom().contents()[0].data += text;
    },
    prependText: function(text) {
        this.dom().contents()[0].data = text + this.dom().contents()[0].data;
    },
    getText: function(options) {
        options = _.extend({raw: false}, options || {});
        var toret = this.dom().text();
        if(!options.raw) {
            toret = toret.replace(utils.unicode.ZWS, '');
        }
        return toret;
    },
    isEmpty: function() {
        // Having at least Zero Width Space is guaranteed be Content Observer
        return this.dom().contents()[0].data === utils.unicode.ZWS;
    },
    after: function(params) {
        if(params instanceof DocumentTextElement || params.text)
            return false;
        var element;
        if(params instanceof DocumentNodeElement) {
            element = params;
        } else {
            element = DocumentNodeElement.create(params, this.canvas);
        }
        this.dom().wrap('<div>');
        this.dom().parent().after(element.dom());
        this.dom().unwrap();
        return element;
    },
    before: function(params) {
        if(params instanceof DocumentTextElement || params.text)
            return false;
        var element;
        if(params instanceof DocumentNodeElement) {
            element = params;
        } else {
            element = DocumentNodeElement.create(params, this.canvas);
        }
        this.dom().wrap('<div>');
        this.dom().parent().before(element.dom());
        this.dom().unwrap();
        return element;
    },
    wrapWithNodeElement: function(wlxmlNode) {
        if(typeof wlxmlNode.start === 'number' && typeof wlxmlNode.end === 'number') {
            return this.canvas.wrapText({
                inside: this.parent(),
                textNodeIdx: this.parent().childIndex(this),
                offsetStart: Math.min(wlxmlNode.start, wlxmlNode.end),
                offsetEnd: Math.max(wlxmlNode.start, wlxmlNode.end),
                _with: {tag: wlxmlNode.tag, klass: wlxmlNode.klass}
            });
        } else {
            return DocumentElement.prototype.wrapWithNodeElement.call(this, wlxmlNode);
        }
    },
    unwrap: function() {
        var parent = this.parent(),
            toret;
        if(parent.children().length === 1) {
            toret = parent.parent();
            var grandParent = parent.parent();
            if(grandParent) {
                var grandParentChildren = grandParent.children(),
                    idx = grandParent.childIndex(parent),
                    prev = idx - 1 > -1 ? grandParentChildren[idx-1] : null,
                    next = idx + 1 < grandParentChildren.length ? grandParentChildren[idx+1] : null;
                
                prev = (prev instanceof DocumentTextElement) ? prev : null;
                next = (next instanceof DocumentTextElement) ? next : null;

                if(prev && next) {
                    prev.setText(prev.getText() + this.getText() + next.getText());
                    next.detach();
                } else if (prev || next) {
                    var target = prev ? prev : next,
                        newText = prev ? target.getText() + this.getText() : this.getText() + target.getText();
                    target.setText(newText);
                } else {
                    parent.after(this);
                }
            } else {
                parent.after(this);
            }
            parent.detach();
            return toret;
        }
    },
    split: function(params) {
        var parentElement = this.parent(),
            myIdx = parentElement.childIndex(this),
            myCanvas = this.canvas,
            passed = false,
            succeedingChildren = [],
            thisElement = this,
            prefix = this.getText().substr(0, params.offset),
            suffix = this.getText().substr(params.offset);

        parentElement.children().forEach(function(child) {
            if(passed)
                succeedingChildren.push(child);
            if(child.sameNode(thisElement))
                passed = true;
        });

        if(prefix.length > 0)
            this.setText(prefix);
        else
            this.detach();
        
        var newElement = DocumentNodeElement.create({tag: parentElement.getWlxmlTag(), klass: parentElement.getWlxmlClass()}, myCanvas);
        parentElement.after(newElement);

        if(suffix.length > 0)
            newElement.append({text: suffix});
        succeedingChildren.forEach(function(child) {
            newElement.append(child);
        });

        return {first: parentElement, second: newElement};
    },
    divide: function(params) {
        var myText = this.getText();

        if(params.offset === myText.length)
            return this.after(params);
        if(params.offset === 0)
            return this.before(params);

        var lhsText = myText.substr(0, params.offset),
            rhsText = myText.substr(params.offset),
            newElement = DocumentNodeElement.create({tag: params.tag, klass: params.klass}, this.canvas),
            rhsTextElement = DocumentTextElement.create({text: rhsText});

        this.setText(lhsText);
        this.after(newElement);
        newElement.after(rhsTextElement);
        return newElement;
    },

    toggleHighlight: function() {
        // do nothing for now
    }
});

return {
    DocumentElement: DocumentElement,
    DocumentNodeElement: DocumentNodeElement,
    DocumentTextElement: DocumentTextElement
};

});