define([
'libs/jquery',
'libs/underscore',
'modules/documentCanvas/canvas/utils'
], function($, _, utils) {
    
'use strict';
/* global Node:false */

// DocumentElement represents a text or an element node from WLXML document rendered inside Canvas
var DocumentElement = function(wlxmlNode, canvas) {
    this.wlxmlNode = wlxmlNode;
    this.canvas = canvas;
    this.state = {
        exposed: false,
        active: false
    };

    this.dom = this.createDOM();
    this.dom.data('canvas-element', this);
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
    updateState: function(toUpdate) {
        var changes = {};
        _.keys(toUpdate)
            .filter(function(key) {
                return this.state.hasOwnProperty(key);
            }.bind(this))
            .forEach(function(key) {
                if(this.state !== toUpdate[key]) {
                    this.state[key] = changes[key] = toUpdate[key];
                }
            }.bind(this));
        if(_.isFunction(this.onStateChange)) {
            this.onStateChange(changes);
        }
    },
    parent: function() {
        var parents = this.dom.parents('[document-node-element]');
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
        return other && (typeof other === typeof this) && other.dom[0] === this.dom[0];
    },

    trigger: function() {
        this.canvas.eventBus.trigger.apply(this.canvas.eventBus, Array.prototype.slice.call(arguments, 0));
    }


});


// DocumentNodeElement represents an element node from WLXML document rendered inside Canvas
var DocumentNodeElement = function(wlxmlNode, canvas) {
    DocumentElement.call(this, wlxmlNode, canvas);
    wlxmlNode.setData('canvasElement', this);
    this.init(this.dom);
};


var manipulate = function(e, params, action) {
    var element;
    if(params instanceof DocumentElement) {
        element = params;
    } else {
        element = e.canvas.createElement(params);
    }
    e.dom[action](element.dom);
    e.refreshPath();
    return element;
};

DocumentNodeElement.prototype = Object.create(DocumentElement.prototype);


$.extend(DocumentNodeElement.prototype, {
    defaultDisplayStyle: 'block',
    init: function() {},
    addWidget: function(widget) {
        this.dom.children('.canvas-widgets').append(widget.DOM ? widget.DOM : widget);
    },
    clearWidgets: function() {
        this.dom.children('.canvas-widgets').empty();
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
        
        wrapper.append(contentContainer, widgetsContainer);
        widgetsContainer.find('*').add(widgetsContainer).attr('tabindex', -1);
        return wrapper;
    },
    _container: function() {
        return this.dom.children('[document-element-content]');
    },
    detach: function() {
        var parents = this.parents();
        this.dom.detach();
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

    isBlock: function() {
        return this.dom.css('display') === 'block';
    },

    displayAsBlock: function() {
        this.dom.css('display', 'block');
        this._container().css('display', 'block');
    },
    displayInline: function() {
        this.dom.css('display', 'inline');
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
        this.dom.css('display', what);
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
        this.dom.detach();
        return this;
    },
    setText: function(text) {
        if(text === '') {
            text = utils.unicode.ZWS;
        }
        if(text !== this.getText()) {
            this.dom.contents()[0].data = text;
        }
    },
    getText: function(options) {
        options = _.extend({raw: false}, options || {});
        var toret = this.dom.text();
        if(!options.raw) {
            toret = toret.replace(utils.unicode.ZWS, '');
        }
        return toret;
    },
    isEmpty: function() {
        // Having at least Zero Width Space is guaranteed be Content Observer
        return this.dom.contents()[0].data === utils.unicode.ZWS;
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
        this.dom.wrap('<div>');
        this.dom.parent().after(element.dom);
        this.dom.unwrap();
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
        this.dom.wrap('<div>');
        this.dom.parent().before(element.dom);
        this.dom.unwrap();
        this.refreshPath();
        return element;
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