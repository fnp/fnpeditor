define([
'libs/jquery',
'libs/underscore',
'modules/documentCanvas/canvas/utils',
'modules/documentCanvas/canvas/wlxmlManagers'
], function($, _, utils, wlxmlManagers) {
    
'use strict';
/* global Node:false, document:false */


// DocumentElement represents a text or an element node from WLXML document rendered inside Canvas
var DocumentElement = function(wlxmlNode, canvas) {
    this.wlxmlNode = wlxmlNode;
    this.canvas = canvas;

    this.$element = this.createDOM();
    this.$element.data('canvas-element', this);
};

$.extend(DocumentElement.prototype, {
    bound: function() {
        return $.contains(document.documentElement, this.dom()[0]);
    },
    dom: function() {
        return this.$element;
    },
    parent: function() {
        var parents = this.$element.parents('[document-node-element]');
        if(parents.length) {
            return this.canvas.getDocumentElement(parents[0]);
        }
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

    getVerticallyFirstTextElement: function() {
        var toret;
        this.children().some(function(child) {
            if(child instanceof DocumentTextElement) {
                toret = child;
                return true; // break
            } else {
                toret = child.getVerticallyFirstTextElement();
                if(toret) {
                    return true; // break
                }
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

    exec: function(method) {
        if(this.manager && this.manager[method]) {
            return this.manager[method].apply(this.manager, Array.prototype.slice.call(arguments, 1));
        }
    }
});


// DocumentNodeElement represents an element node from WLXML document rendered inside Canvas
var DocumentNodeElement = function(wlxmlNode, canvas) {
    DocumentElement.call(this, wlxmlNode, canvas);
    wlxmlNode.setData('canvasElement', this);
};


var manipulate = function(e, params, action) {
    var element;
    if(params instanceof DocumentElement) {
        element = params;
    } else {
        element = e.canvas.createElement(params);
    }
    var target = (action === 'append' || action === 'prepend') ? e._container() : e.dom();
    target[action](element.dom());
    return element;
};

DocumentNodeElement.prototype = Object.create(DocumentElement.prototype);


$.extend(DocumentNodeElement.prototype, {
    createDOM: function() {
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
        this.$element = dom; //@!!!

        this.setWlxmlTag(this.wlxmlNode.getTagName());
        this.setWlxmlClass(this.wlxmlNode.getClass());

        this.wlxmlNode.contents().forEach(function(node) {
            container.append(this.canvas.createElement(node).dom());
        }.bind(this));
        return dom;
    },
    _container: function() {
        return this.dom().children('[document-element-content]');
    },
    detach: function() {
        this.dom().detach();
        this.canvas = null;
        return this;
    },
    append: function(params) {
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
        if(this instanceof DocumentTextElement) {
            return toret;
        }


        var elementContent = this._container().contents();
        var element = this;
        elementContent.each(function() {
            var childElement = element.canvas.getDocumentElement(this);
            if(childElement === undefined) {
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
    },
    getWlxmlClass: function() {
        var klass = this._container().attr('wlxml-class');
        if(klass) {
            return klass.replace(/-/g, '.');
        }
        return undefined;
    },
    setWlxmlClass: function(klass) {
        if(klass === this.getWlxmlClass()) {
            return;
        }
        if(klass) {
            this._container().attr('wlxml-class', klass.replace(/\./g, '-'));
        }
        else {
            this._container().removeAttr('wlxml-class');
        }
        this.manager = wlxmlManagers.getFor(this);
        this.manager.setup();
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
        if(this.manager) {
            this.manager.toggle(toggle);
        }
    }
});


// DocumentNodeElement represents a text node from WLXML document rendered inside Canvas
var DocumentTextElement = function(wlxmlTextNode, canvas) {
    DocumentElement.call(this, wlxmlTextNode, canvas);
};

$.extend(DocumentTextElement, {
    isContentContainer: function(htmlElement) {
        return htmlElement.nodeType === Node.TEXT_NODE && $(htmlElement).parent().is('[document-text-element]');
    }
});

DocumentTextElement.prototype = Object.create(DocumentElement.prototype);

$.extend(DocumentTextElement.prototype, {
    createDOM: function() {
        return $('<div>')
            .attr('document-text-element', '')
            .text(this.wlxmlNode.getText() || utils.unicode.ZWS);
    },
    detach: function() {
        this.dom().detach();
        this.canvas = null;
        return this;
    },
    setText: function(text) {
        this.dom().contents()[0].data = text;
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
        if(params instanceof DocumentTextElement || params.text) {
            return false;
        }
        var element;
        if(params instanceof DocumentNodeElement) {
            element = params;
        } else {
            element = this.canvas.createElement(params);
        }
        this.dom().wrap('<div>');
        this.dom().parent().after(element.dom());
        this.dom().unwrap();
        return element;
    },
    before: function(params) {
        if(params instanceof DocumentTextElement || params.text) {
            return false;
        }
        var element;
        if(params instanceof DocumentNodeElement) {
            element = params;
        } else {
            element = this.canvas.createElement(params);
        }
        this.dom().wrap('<div>');
        this.dom().parent().before(element.dom());
        this.dom().unwrap();
        return element;
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