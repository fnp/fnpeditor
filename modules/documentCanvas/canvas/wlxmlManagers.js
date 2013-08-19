define([
'libs/jquery-1.9.1.min',
'modules/documentCanvas/canvas/widgets'
], function($, widgets) {
    
'use strict';


var DocumentElementWrapper = function(documentElement) {
    
    this.documentElement = documentElement;

    this.addWidget = function(widget) {
        documentElement.dom().children('.canvas-widgets').append(widget);
    };

    this.clearWidgets = function() {
        documentElement.dom().children('.canvas-widgets').empty();
    }

    this.setDisplayStyle = function(displayStyle) {
        documentElement.dom().css('display', displayStyle || '');
        documentElement._container().css('display', displayStyle || '');
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

    var eventBus = documentElement.canvas ? documentElement.canvas.eventBus :
        {trigger: function() {}};
    this.trigger = function() {
        eventBus.trigger.apply(eventBus, arguments);
    }

}

var getDisplayStyle = function(tag, klass) {
    if(tag === 'metadata')
        return 'none';
    if(tag === 'span')
        return 'inline';
    if(klass === 'item')
        return null;
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

    },
    toggle: function(toggle) {
        this.el.toggle(toggle);
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
            this.toggle(true);
        }.bind(this);
        this.footnoteHandler = widgets.footnoteHandler(clickHandler);
        this.el.addWidget(this.footnoteHandler);

        var closeHandler = function() {
            this.toggle(false);

        }.bind(this);
        this.hideButton = widgets.hideButton(closeHandler);
        this.el.addWidget(this.hideButton);

        this.toggle(false, {silent: true});
    },
    toggle: function(toggle, options) {
        options = options || {};
        this.hideButton.toggle(toggle);
        this.footnoteHandler.toggle(!toggle);
        
        this.el.setDisplayStyle(toggle ? 'block' : 'inline');
        this.el.toggle(toggle);
        if(!options.silent)
            this.el.trigger('elementToggled', toggle, this.el.documentElement);
    }
})
managers.set('aside', 'footnote', FootnoteManager);


var ListItemManager = function(wlxmlElement) {
    this.el = wlxmlElement;
};
$.extend(ListItemManager.prototype, {
    setup: function() {
        this.el.clearWidgets();
        this.el.addWidget(widgets.labelWidget(this.el.tag(), this.el.klass()));
        this.el.documentElement._container().css({display: 'list-item'});
    },
    toggleBullet: function(toggle) {
        this.el.documentElement._container().css({display : toggle ? 'list-item' : 'block'});
    }
});
managers.set('div', 'item', ListItemManager);

return {
    getFor: function(documentElement) {
        var wlxmlElement = new DocumentElementWrapper(documentElement);
        return new (managers.get(wlxmlElement.tag(), wlxmlElement.klass()))(wlxmlElement);

    }
};

});