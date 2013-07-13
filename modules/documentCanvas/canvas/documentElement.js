define([
'libs/jquery-1.9.1.min',
'libs/underscore-min'
], function($, _) {
    
'use strict';


// DocumentElement represents a node from WLXML document rendered inside Canvas
var DocumentElement = function(htmlElement, canvas) {
    if(arguments.length === 0)
        return;
    this.canvas = canvas;
    this.$element = $(htmlElement);
}

$.extend(DocumentElement.prototype, {
    dom: function() {
        return this.$element;
    },
    parent: function() {
        var parents = this.$element.parents('[wlxml-tag]');
        if(parents.length)
            return documentElementFromHTMLElement(parents[0], this.canvas);
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


var DocumentNodeElement = function(htmlElement, canvas) {
    DocumentElement.call(this, htmlElement, canvas);
};

var DocumentTextElement = function(htmlElement, canvas) {
    DocumentElement.call(this, htmlElement, canvas);
};

DocumentNodeElement.prototype = new DocumentElement();
DocumentTextElement.prototype = new DocumentElement();

var manipulate = function(e, params, action) {
    var dom;
    if(params instanceof DocumentElement) {
        dom = params.dom()
    } else {
        dom = DocumentNodeElement.createDOM(params);
    }
    e.dom()[action](dom);
    return documentElementFromHTMLElement(dom);
};

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
            var childElement = documentElementFromHTMLElement(this, element.canvas);
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

DocumentNodeElement.createDOM = function(params) {
    var dom;
    if(params.text) {
        dom = $(document.createTextNode(params.text));
    } else {
        dom = $('<div>').attr('wlxml-tag', params.tag);
        if(params.klass)
            dom.attr('wlxml-class', params.klass);
    }
    return dom;
};


DocumentNodeElement.create = function(params, canvas) {
    return documentElementFromHTMLElement(DocumentNodeElement.createDOM(params)[0]);
};


$.extend(DocumentTextElement.prototype, {
    setText: function(text) {
        this.dom()[0].data = text;
    },
    getText: function() {
        return this.dom().text();
    },
    after: function(params) {
        if(params instanceof DocumentTextElement || params.text)
            return false;
        var dom;
        if(params instanceof DocumentNodeElement) {
            dom = params.dom();
        } else {
            dom = DocumentNodeElement.createDOM(params);
        }
        this.dom().wrap('<div>');
        this.dom().parent().after(dom[0]);
        this.dom().unwrap();
        return documentElementFromHTMLElement(dom[0]);
    },
    before: function(params) {
        if(params instanceof DocumentTextElement || params.text)
            return false;
        var dom;
        if(params instanceof DocumentNodeElement) {
            dom = params.dom();
        } else {
            dom = DocumentNodeElement.createDOM(params);
        }
        this.dom().wrap('<div>');
        this.dom().parent().before(dom[0]);
        this.dom().unwrap();
        return documentElementFromHTMLElement(dom[0]);
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

var documentElementFromHTMLElement = function(htmlElement, canvas) {
    // if(!canvas)
    //    throw 'no canvas specified';
    if(htmlElement.nodeType === Node.ELEMENT_NODE)
        return new DocumentNodeElement(htmlElement, canvas);
    if(htmlElement.nodeType === Node.TEXT_NODE)
        return new DocumentTextElement(htmlElement, canvas);
};

return {
    wrap: function(htmlElement, canvas) {
        return documentElementFromHTMLElement(htmlElement, canvas);
    },
    DocumentElement: DocumentElement,
    DocumentNodeElement: DocumentNodeElement,
    DocumentTextElement: DocumentTextElement
};

});