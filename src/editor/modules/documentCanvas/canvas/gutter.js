define(function(require) {
    
'use strict';

var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    Backbone = require('libs/backbone'),
    gutterBoxTemplate = require('libs/text!./gutterBox.html');


var GutterView = function(gutter) {
    gutter.on('show', function(group) {
        if(this.groupView) {
            this.groupView.remove();
        }
        this.groupView = new GutterGroupView(this, group);
        this.dom.append(this.groupView.dom);
        this.groupView.dom.css({top: group.getOffsetHint()});
        this.groupView.show();
    }, this);
    this.dom = $('<div class="gutter"></div>');
};


var GutterGroupView = function(gutterView, group) {
    this.gutterView = gutterView;
    this.group = group;
    this.views  = [];
    
    this.dom = $(gutterBoxTemplate);

    this.dom.on('click', function() {
        if(!this.dom.hasClass('focused')) {
            var canvas = this.group.meta.canvas;
            canvas.setCurrentElement(this.group.meta);
        }
    }.bind(this));
    
    this.group.views.forEach(function(view) {
        this.onViewAdded(view);
    }.bind(this));
    
    this.group.on('viewAdded', this.onViewAdded, this);
    this.group.on('focusToggled', this.onFocusToggled, this);
};
$.extend(GutterGroupView.prototype, {
    remove: function() {
        this.group.off('viewAdded', this.onViewAdded);
        this.group.off('offsetChange', this.onOffsetChange);
        this.group.off('focusToggled', this.onFocusToggled);
        this.dom.detach();
    },
    onViewAdded: function(view) {
        this.views.push(view);
        this.dom.append(view.dom);
    },
    show: function() {
        this.dom.addClass('focused');
        this.views.forEach(function(view) {
            if(view.onActivated) {
                view.onActivated();
            }
        });
    }
});



/// model

var ViewGroup = function(params, gutter, meta) {
    this.gutter = gutter;
    this.params = params;
    this.meta = meta;
    this.view = $(gutterBoxTemplate);
    this.views = [];
};
$.extend(ViewGroup.prototype, Backbone.Events, {
    getOffsetHint: function() {
        return _.isFunction(this.params.offsetHint) ? this.params.offsetHint() : this.params.offsetHint;
    },
    setOffset: function(offset) {
        this.trigger('offsetChange', offset);
        this._offset = offset;
    },
    addView: function(view) {
        this.views.push(view);
        this.trigger('viewAdded', view);
    },
    show: function() {
        this.gutter.show(this);
    }
});


var Gutter = function() {
};

_.extend(Gutter.prototype, Backbone.Events, {
    createViewGroup: function(params, meta) {
        return new ViewGroup(params, this, meta);
    },
    show: function(group) {
        this.trigger('show', group);
    },
});


return {
    create: function() {
        return new Gutter();
    },
    GutterView: GutterView,
    GutterGroupView: GutterGroupView
};

});