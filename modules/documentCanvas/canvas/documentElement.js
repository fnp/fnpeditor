define([
'libs/jquery-1.9.1.min',
'libs/underscore-min'
], function($, _) {
    
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
        if(htmlElement.nodeType === Node.ELEMENT_NODE && $element.attr('wlxml-tag'))
            return DocumentNodeElement.fromHTMLElement(htmlElement, canvas);
        if($element.attr('wlxml-text') !== undefined || (htmlElement.nodeType === Node.TEXT_NODE && $element.parent().attr('wlxml-text') !== undefined))
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
        var parents = this.$element.parents('[wlxml-tag]');
        if(parents.length)
            return DocumentElement.fromHTMLElement(parents[0], this.canvas);
        return null;
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
    }
});


// DocumentNodeElement represents an element node from WLXML document rendered inside Canvas
var DocumentNodeElement = function(htmlElement, canvas) {
    DocumentElement.call(this, htmlElement, canvas);
};

$.extend(DocumentNodeElement, {
    createDOM: function(params) {
        var dom = $('<div>').attr('wlxml-tag', params.tag);
        if(params.klass)
            dom.attr('wlxml-class', params.klass);
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
    e.dom()[action](element.dom());
    return element;
};

DocumentNodeElement.prototype = new DocumentElement();

$.extend(DocumentNodeElement.prototype, {
    append: function(params) {
        manipulate(this, params, 'append');
    },
    before: function(params) {
        manipulate(this, params, 'before');

    },
    after: function(params) {
        manipulate(this, params, 'after');
    },
    children: function() {
        var toret = [];
        if(this instanceof DocumentTextElement)
            return toret;


        var elementContent = this.dom().contents();
        var element = this;
        elementContent.each(function(idx) {
            var childElement = DocumentElement.fromHTMLElement(this, element.canvas);
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
        return this.dom().attr('wlxml-tag');
    },
    setWlxmlTag: function(tag) {
        this.dom().attr('wlxml-tag', tag);
    },
    getWlxmlClass: function() {
        var klass = this.dom().attr('wlxml-class');
        if(klass)
            return klass.replace('-', '.');
        return undefined;
    },
    setWlxmlClass: function(klass) {
        if(klass)
            this.dom().attr('wlxml-class', klass);
        else
            this.dom().removeAttr('wlxml-class');
    },
    is: function(what) {
        if(what === 'list' && _.contains(['list-items', 'list-items-enum'], this.dom().attr('wlxml-class')))
            return true;
        return false;
    }
});


// DocumentNodeElement represents a text node from WLXML document rendered inside Canvas
var DocumentTextElement = function(htmlElement, canvas) {
    DocumentElement.call(this, htmlElement, canvas);
};

$.extend(DocumentTextElement, {
    createDOM: function(params) {
        return $('<div>')
            .attr('wlxml-text', '')
            .text(params.text);
    },

    create: function(params, canvas) {
        return this.fromHTMLElement(this.createDOM(params)[0]);
    },

    fromHTMLElement: function(htmlElement, canvas) {
        return new this(htmlElement, canvas);
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
    setText: function(text) {
        this.dom().contents()[0].data = text;
    },
    getText: function() {
        return this.dom().text();
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
        var parent = this.parent();
        if(parent.children().length === 1) {
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
    }
});

return {
    DocumentElement: DocumentElement,
    DocumentNodeElement: DocumentNodeElement,
    DocumentTextElement: DocumentTextElement
};

});