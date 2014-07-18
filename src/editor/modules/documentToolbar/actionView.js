define(function(require) {
    
'use strict';
/* globals gettext */

var $ = require('libs/jquery'),
    Backbone = require('libs/backbone'),
    _ = require('libs/underscore'),
    viewTemplate = require('libs/text!modules/documentToolbar/templates/actionView.html'),
    buttonTemplate = require('libs/text!modules/documentToolbar/templates/actionViewButton.html'),
    selectionTemplate = require('libs/text!modules/documentToolbar/templates/actionViewSelection.html');


viewTemplate = _.template(viewTemplate);
buttonTemplate = _.template(buttonTemplate);
selectionTemplate = _.template(selectionTemplate);

var iconExists = function(iconName) {
    /* globals window */
    var el = $('<i>').addClass('icon-' + iconName);
    $('body').append(el);
    var style = window.getComputedStyle(el[0]);
    var toret = /glyphicons/.test(style.backgroundImage) && !/14px 14px/.test(style.backgroundPosition);
    el.remove();
    return toret;
};

var ActionView = Backbone.View.extend({
    events: {
        'mousedown .btn': 'onMouseDown',
        'click .btn': 'onExecute',
        'change select': 'onSelectionChange',
        'mouseenter': 'onMouseEnter',
        'mouseleave': 'onMouseLeave'
    },
    initialize: function() {
        this.action = this.options.action;
        this.action.on('paramsChanged', function() {
            this.render();
        }, this);
        this.setElement(viewTemplate());
    },
    render: function() {
        /* globals document */

        var actionState = this.action.getState();

        if(!actionState) {
            this.$el.html(buttonTemplate({label: gettext('error :('), iconName:''}));
            this._button().attr('disabled', true);
            return;
        }

        var templateContext = {
            label: actionState.label || '?',
            iconName: (iconExists(actionState.icon)) ? actionState.icon : null,
            iconStyle: actionState.iconStyle
        },
            hovered = document.querySelectorAll(':hover'),
            hovers = false,
            button = this._button();
           
        if(hovered.length && _.last(hovered) === button[0]) {
            hovers = true;
        }

        this.$el.empty();
        _.pairs(this.action.definition.params).forEach(function(pair) {
            var paramName = pair[0],
                paramDesc = pair[1],
                widget;
            if(paramDesc.type === 'select') {
                widget = $(selectionTemplate({
                    paramName: paramName,
                    options: paramDesc.options
                }));
                if(this.action.params[paramName]) {
                    widget.find('option[value=' + this.action.params[paramName].id + ']').attr('selected', true);
                }
                this.$el.append(widget);
            }
        }.bind(this));

        this.$el.append(buttonTemplate(templateContext));
        button = this._button();
        
        if(!actionState.allowed) {
            button.attr('disabled', true);
            button.wrap('<div style="position: relative;">');
            button.after('<div style="position: absolute; top:0; bottom:0; left:0; right: 0"></div>');
        }
        
        if(actionState.toggled !== undefined) {
            button.toggleClass('active', actionState.toggled);
        }

        if(hovers) {
            this.trigger('hover');
        }
    },
    onMouseEnter: function() {
        this.trigger('hover');
    },
    onMouseLeave: function() {
        this.trigger('leave');
    },
    onMouseDown: function() {
        this.trigger('mousedown');
    },
    onExecute: function() {
        this.action.execute();
    },
    onSelectionChange: function(e) {
        var select = $(e.target),
            paramName = select.attr('param');

        this.action.definition.params[paramName].options.some(function(option) {
            if(option.id.toString() === select.val()) {
                this.action.updateWidgetParam(paramName, option);
                return true; // break
            }
        }.bind(this));
    },
    _button: function() {
        return this.$el.find('button');
    }
});

var create = function(action) {
    var view = new ActionView({action:action});
    view.render();

    return {
        on: function() {
            view.on.apply(view, Array.prototype.slice.call(arguments, 0));
        },
        dom: view.$el,
    };
};

return {
    create: create
};

});