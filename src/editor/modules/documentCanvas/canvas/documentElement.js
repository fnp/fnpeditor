define([
'libs/jquery',
'libs/underscore',
'modules/documentCanvas/canvas/utils'
], function($, _, utils) {
    
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
    refreshPath: function() {
        this.parents().forEach(function(parent) {
            parent.refresh();
        });
        this.refresh();
    },
    refresh: function() {
        // noop
    },
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

    trigger: function() {
        //this.canvas.bus.trigger()
    }


});


// DocumentNodeElement represents an element node from WLXML document rendered inside Canvas
var DocumentNodeElement = function(wlxmlNode, canvas) {
    DocumentElement.call(this, wlxmlNode, canvas);
    wlxmlNode.setData('canvasElement', this);
    this.init(this.$element);
};


var manipulate = function(e, params, action) {
    var element;
    if(params instanceof DocumentElement) {
        element = params;
    } else {
        element = e.canvas.createElement(params);
    }
    e.dom()[action](element.dom());
    e.refreshPath();
    return element;
};

DocumentNodeElement.prototype = Object.create(DocumentElement.prototype);


$.extend(DocumentNodeElement.prototype, {
    defaultDisplayStyle: 'block',
    addWidget: function(widget) {
        this.$element.children('.canvas-widgets').append(widget.DOM ? widget.DOM : widget);
    },
    clearWidgets: function() {
        this.$element.children('.canvas-widgets').empty();
    },
    handle: function(event) {
        var method = 'on' + event.type[0].toUpperCase() + event.type.substr(1);
        if(this[method]) {
            this[method](event);
        }
    },
    createDOM: function() {
        var wrapper = $('<div>').attr('document-node-element', ''),
            widgetsContainer = $('<div>')
                .addClass('canvas-widgets')
                .attr('contenteditable', false),
            contentContainer = $('<div>')
                .attr('document-element-content', '');
        
        wrapper.append(widgetsContainer, contentContainer);
        widgetsContainer.find('*').add(widgetsContainer).attr('tabindex', -1);
        return wrapper;
    },
    _container: function() {
        return this.dom().children('[document-element-content]');
    },
    detach: function() {
        var parents = this.parents();
        this.dom().detach();
        this.canvas = null;
        if(parents[0]) {
            parents[0].refreshPath();
        }
         return this;
    },
    before: function(params) {
        return manipulate(this, params, 'before');

    },
    after: function(params) {
        return manipulate(this, params, 'after');
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

    isBlock: function() {
        return this.dom().css('display') === 'block';
    },

    displayAsBlock: function() {
        this.dom().css('display', 'block');
        this._container().css('display', 'block');
    },
    displayInline: function() {
        this.dom().css('display', 'inline');
        this._container().css('display', 'inline');
    },
    displayAs: function(what) {
        // [this.dom(), this._container()].forEach(e) {
        //     var isBlock = window.getComputedStyle(e).display === 'block';
        //     if(!isBlock && what === 'block') {
        //         e.css('display', what);
        //     } else if(isBlock && what === 'inline') {
        //         e.css('display')
        //     }
        // })
        this.dom().css('display', what);
        this._container().css('display', what);
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
        var dom = $('<div>')
            .attr('document-text-element', '')
            .text(this.wlxmlNode.getText() || utils.unicode.ZWS);
        return dom;
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
        this.refreshPath();
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
        this.refreshPath();
        return element;
    },

    toggleHighlight: function() {
        // do nothing for now
    },
    children: function() {
        return [];
    }

});


return {
    DocumentElement: DocumentElement,
    DocumentNodeElement: DocumentNodeElement,
    DocumentTextElement: DocumentTextElement
};

});