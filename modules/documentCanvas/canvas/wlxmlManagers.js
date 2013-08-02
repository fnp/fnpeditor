define([
'libs/jquery-1.9.1.min',
'modules/documentCanvas/canvas/widgets'
], function($, widgets) {
    
'use strict';


var DocumentElementWrapper = function(documentElement) {
    
    this.addWidget = function(widget) {
        documentElement.dom().find('.canvas-widgets').append(widget);
    };

    this.clearWidgets = function() {
        documentElement.dom().find('.canvas-widgets').empty();
    }

    this.setDisplayStyle = function(displayStyle) {
        documentElement.dom().css('display', displayStyle);
        documentElement._container().css('display', displayStyle);
    };

    this.tag = function() {
        return documentElement.getWlxmlTag();
    };

    this.klass = function() {
        return documentElement.getWlxmlClass();
    };

    this.toggle = function(toggle) {
        documentElement._container().toggle(toggle);
    }
}

var getDisplayStyle = function(tag, klass) {
    if(tag === 'metadata')
        return 'none';
    if(tag === 'span')
        return 'inline';
    return 'block';
}

var GenericManager = function(wlxmlElement) {
    this.el = wlxmlElement;
};

$.extend(GenericManager.prototype, {
    setup: function() {
        this.el.setDisplayStyle(getDisplayStyle(this.el.tag(), this.el.klass()));

        this.el.clearWidgets();
        this.el.addWidget(widgets.labelWidget(this.el.tag(), this.el.klass()));

    }
})

var managers = {
    _m: {},
    set: function(tag, klass, manager) {
        if(!this._m[tag])
            this._m[tag] = {};
        this._m[tag][klass] = manager;
    },
    get: function(tag,klass) {
        if(this._m[tag] && this._m[tag][klass])
            return this._m[tag][klass];
        return GenericManager;
    }
}

var FootnoteManager = function(wlxmlElement) {
    this.el = wlxmlElement;
};
$.extend(FootnoteManager.prototype, {
    setup: function() {
        this.el.clearWidgets();

        var clickHandler = function() {
            this._toggleFootnote(true);
        }.bind(this);
        this.footnoteHandler = widgets.footnoteHandler(clickHandler);
        this.el.addWidget(this.footnoteHandler);

        var closeHandler = function() {
            this._toggleFootnote(false);

        }.bind(this);
        this.hideButton = widgets.hideButton(closeHandler);
        this.el.addWidget(this.hideButton);

        this._toggleFootnote(false);
    },
    _toggleFootnote: function(toggle) {
        this.hideButton.toggle(toggle);
        this.footnoteHandler.toggle(!toggle);
        
        this.el.setDisplayStyle(toggle ? 'block' : 'inline');
        this.el.toggle(toggle);
    }
})
managers.set('aside', 'footnote', FootnoteManager);


return {
    getFor: function(documentElement) {
        var wlxmlElement = new DocumentElementWrapper(documentElement);
        return new (managers.get(wlxmlElement.tag(), wlxmlElement.klass()))(wlxmlElement);

    }
};

});