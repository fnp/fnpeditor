define([
'libs/jquery-1.9.1.min',
'modules/documentCanvas/canvas/widgets'
], function($, widgets) {
    
'use strict';


var DocumentElementAPI = function(documentElement) {
    
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

return {
    getFor: function(documentElement) {
        var wlxmlElement = new DocumentElementAPI(documentElement);
        return new GenericManager(wlxmlElement);
    }
};

});