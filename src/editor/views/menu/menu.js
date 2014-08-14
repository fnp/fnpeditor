define(function(require) {
    
'use strict';

var $ = require('libs/jquery'),
    Backbone = require('libs/backbone'),
    template = require('libs/text!./menu.html'),
    itemTemplate = require('libs/text!./menuitem.html');


var Menu = function() {
    this.dom = $(template);
    this.actions = [];
};
$.extend(Menu.prototype, {
    addAction: function(action) {
        var item = new MenuItem(action);
        item.on('execute', function() {
            this.close();
            action.execute();
        }.bind(this));

        this.actions.push(action);
        this.dom.find('ul').append(item.dom);
    },
    close: function() {
        this.dom.remove();
    },
    show: function() {
        this.dom.find('.dropdown-menu').dropdown('toggle');
    },
    updateContextParam: function(k, v) {
        this.actions.forEach(function(action) {
            action.updateContextParam(k, v);
        });
    }
});

var MenuItem = function(action) {
    this.action = action;
    this.dom = $(itemTemplate);
    
    action.on('paramsChanged', function() {
        this.render();
    }.bind(this));

    this.dom.on('click', function() {
        if(this.action.getState().allowed) {
            this.trigger('execute');
        }
    }.bind(this));

    this.render();
};
$.extend(MenuItem.prototype, Backbone.Events, {
    render: function() {
        var state = this.action.getState();
        this.dom.find('a').text(state.label || '?');
        this.dom.toggleClass('disabled', !state.allowed);
    }
});


return Menu;

});
