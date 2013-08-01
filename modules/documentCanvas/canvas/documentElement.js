define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'modules/documentCanvas/classAttributes',
'modules/documentCanvas/canvas/utils'
], function($, _, classAttributes, utils) {
    
'use strict';


// DocumentElement represents a text or an element node from WLXML document rendered inside Canvas
var DocumentElement = function(htmlElement, canvas) {
    if(arguments.length === 0)
        return;
    this.canvas = canvas;
    this._setupDOMHandler(htmlElement);
}

var elementTypeFromParams = function(params) {
    return params.text !== undefined ? DocumentTextElement : DocumentNodeElement;

};

$.extend(DocumentElement, {
    create: function(params, canvas) {
        return elementTypeFromParams(params).create(params);
    },

    createDOM: function(params) {
        return elementTypeFromParams(params).createDOM(params);
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
    dom: function() {
        return this.$element;
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
        var wrapper = DocumentNodeElement.create({tag: wlxmlNode.tag, klass: wlxmlNode.klass});
        this.dom().replaceWith(wrapper.dom());
        wrapper.append(this);
        return wrapper;
    },

    detach: function() {
        this.dom().detach();
        this.canvas = null;
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

    isVisible: function() {
        return this instanceof DocumentTextElement || this.getWlxmlTag() !== 'metadata';
    }
});


// DocumentNodeElement represents an element node from WLXML document rendered inside Canvas
var DocumentNodeElement = function(htmlElement, canvas) {
    DocumentElement.call(this, htmlElement, canvas);
};

var getDisplayStyle = function(tag, klass) {
    if(tag === 'metadata')
        return 'none';
    if(tag === 'span')
        return 'inline';
    return 'block';
}

$.extend(DocumentNodeElement, {
    createDOM: function(params) {
        var dom = $('<div document-node-element>'),
            container = $('<div document-element-content>');
        
        container.attr('wlxml-tag', params.tag);
        if(params.klass)
            container.attr('wlxml-class', params.klass.replace(/\./g, '-'));
        if(params.meta) {
            _.keys(params.meta).forEach(function(key) {
                dom.attr('wlxml-meta-'+key, params.meta[key]);
            });
        }
        dom.data('other-attrs', params.others);

        /* display style */
        var displayStyle = getDisplayStyle(params.tag, params.klass);
        dom.css('display', displayStyle);
        container.css('display', displayStyle);

        var widgets = $('<div class="canvas-widgets" contenteditable="false">');
        widgets.append($('<span class="canvas-widget canvas-widget-label">').text(params.tag + (params.klass ? ' / ' + params.klass : '')));
        dom.append(widgets);

        // Make sure widgets aren't navigable with arrow keys
        widgets.find('*').add(widgets).attr('tabindex', -1);
        
        dom.append(container);

        if(params.rawChildren) {
            container.append(params.rawChildren);
        }
        return dom;
    },

    create: function(params, canvas) {
        return this.fromHTMLElement(this.createDOM(params)[0]);
    },

    fromHTMLElement: function(htmlElement, canvas) {
        return new this(htmlElement, canvas);
    }
});

var manipulate = function(e, params, action) {
    var element;
    if(params instanceof DocumentElement) {
        element = params;
    } else {
        element = DocumentElement.create(params);
    }
    var target = action === 'append' ? e._container() : e.dom();
    target[action](element.dom());
    return element;
};

DocumentNodeElement.prototype = new DocumentElement();


$.extend(DocumentNodeElement.prototype, {
    _container: function() {
        return this.dom().children('[document-element-content]');
    },
    data: function() {
        var dom = this.dom(),
            args = Array.prototype.slice.call(arguments, 0);
        if(args.length === 2 && args[1] === undefined)
            return dom.removeData(args[0]);
        return dom.data.apply(dom, arguments);
    },
    toXML: function(level) {
        var node = $('<' + this.getWlxmlTag() + '>');

        if(this.getWlxmlClass())
            node.attr('class', this.getWlxmlClass());
        var meta = this.getWlxmlMetaAttrs();
        meta.forEach(function(attr) {
            if(attr.value)
                node.attr('meta-' + attr.name, attr.value);
        });
        _.keys(this.data('other-attrs') || {}).forEach(function(key) {
            node.attr(key, this.data('other-attrs')[key]);
        }, this);

        var addFormatting = function() {
            var toret = $('<div>');
            var formattings = {};

            if(this.data('orig-before') !== undefined) {
                if(this.data('orig-before')) {
                    toret.prepend(document.createTextNode(this.data('orig-before')));
                }
            } else if(level && this.getWlxmlTag() !== 'span') {
                toret.append('\n' + (new Array(level * 2 + 1)).join(' '));
            }

            toret.append(node);

            if(this.data('orig-after')) {
                toret.append(document.createTextNode(this.data('orig-after')));
            }

            /* Inside node */
            if(this.data('orig-begin')) {
                node.prepend(this.data('orig-begin'));
                formattings.begin = true;
            }

            if(this.data('orig-end') !== undefined) {
                if(this.data('orig-end')) {
                    node.append(this.data('orig-end'));
                }
            } else if(this.getWlxmlTag() !== 'span' && children.length){
                node.append('\n' + (new Array(level * 2 + 1)).join(' '));
            }
           
            return {parts: toret.contents(), formattings: formattings};
        }.bind(this);

        
        
        var children = this.children(),
            childParts;

        var formatting = addFormatting(node);

        for(var i = children.length - 1; i >= 0; i--) {
            childParts = children[i].toXML(level + 1);
            if(typeof childParts === 'string')
                childParts = [document.createTextNode(childParts)];

            if(formatting.formattings.begin) {
                $(node.contents()[0]).after(childParts);
            } else
                node.prepend(childParts);
        }
        return formatting.parts;
    },
    append: function(params) {
        if(params.tag !== 'span')
            this.data('orig-end', undefined);
        return manipulate(this, params, 'append');
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
        this._container().attr('wlxml-tag', tag);
        this._updateDisplayStyle();
    },
    getWlxmlClass: function() {
        var klass = this._container().attr('wlxml-class');
        if(klass)
            return klass.replace(/-/g, '.');
        return undefined;
    },
    setWlxmlClass: function(klass) {
        this.getWlxmlMetaAttrs().forEach(function(attr) {
            if(!classAttributes.hasMetaAttr(klass, attr.name))
                this.dom().removeAttr('wlxml-meta-' + attr.name);
        }, this);

        if(klass)
            this._container().attr('wlxml-class', klass.replace(/\./g, '-'));
        else
            this._container().removeAttr('wlxml-class');
        this._updateDisplayStyle();
    },
    _updateDisplayStyle: function() {
        var displayStyle = getDisplayStyle(this.getWlxmlTag, this.getWlxmlClass);
        this.dom().css('display', displayStyle);
        this._container().css('display', displayStyle);
    },
    is: function(what) {
        if(what === 'list' && _.contains(['list.items', 'list.items.enum'], this.getWlxmlClass()))
            return true;
        return false;
    },

    getWlxmlMetaAttr: function(attr) {
        return this.dom().attr('wlxml-meta-'+attr);
    },

    getWlxmlMetaAttrs: function() {
        var toret = [];
        var attrList = classAttributes.getMetaAttrsList(this.getWlxmlClass());
        attrList.all.forEach(function(attr) {
            toret.push({name: attr.name, value: this.getWlxmlMetaAttr(attr.name) || ''});
        }, this);
        return toret;
    },

    setWlxmlMetaAttr: function(attr, value) {
        this.dom().attr('wlxml-meta-'+attr, value);
    },
    
    toggleLabel: function(toggle) {
        var displayCss = toggle ? 'inline-block' : 'none';
        var label = this.dom().children('.canvas-widgets').find('.canvas-widget-label');
        label.css('display', displayCss);
        this.toggleHighlight(toggle);
    },

    toggleHighlight: function(toogle) {
        this._container().toggleClass('highlighted-element');
    }
});


// DocumentNodeElement represents a text node from WLXML document rendered inside Canvas
var DocumentTextElement = function(htmlElement, canvas) {
    DocumentElement.call(this, htmlElement, canvas);
};

$.extend(DocumentTextElement, {
    createDOM: function(params) {
        return $('<div>')
            .attr('document-text-element', '')
            .text(params.text || utils.unicode.ZWS);
    },

    create: function(params, canvas) {
        return this.fromHTMLElement(this.createDOM(params)[0]);
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
    toXML: function(parent) {
        return this.getText();
    },
    _setupDOMHandler: function(htmlElement) {
        var $element = $(htmlElement);
        if(htmlElement.nodeType === Node.TEXT_NODE)
            this.$element = $element.parent();
        else
            this.$element = $element;
    },
    setText: function(text) {
        this.dom().contents()[0].data = text;
    },
    getText: function() {
        return this.dom().text().replace(utils.unicode.ZWS, '');
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
            element = DocumentNodeElement.create(params);
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
            element = DocumentNodeElement.create(params);
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
                if(prev && next) {
                    prev.setText(prev.getText() + this.getText() + next.getText());
                    next.detach();
                } else if (prev || next) {
                    var target = prev ? prev : next;
                    target.setText(target.getText() + this.getText());
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