define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    $ = require('libs/jquery'),
    Backbone = require('libs/backbone'),
    template = require('libs/text!./template.html'),
    itemTemplate = require('libs/text!./itemTemplate.html');


var OpenSelect = Backbone.View.extend({
    className: 'openSelect',
    events: {
        'click a': 'onSelection',
    },
    initialize: function() {
        this.$el.css('position', 'relative');
        this.$el.append(_.template(template)({value: this.options.value || ''}));
        this.$('.toggle').dropdown();
        this.menu = this.$('.dropdown-menu');
        this.toggleHandler(false);
        if(this.options.inputTemplate) {
            this.input = $(this.options.inputTemplate);
            this.$('.input-wrapper').append(this.input);
        }
    },
    toggleHandler: function(toggle) {
        this.$('.toggle').css('visibility', toggle ? 'inherit' : 'hidden');
    },
    addItem: function(value) {
        this.menu.append(_.template(itemTemplate)({value: value}));
        this.toggleHandler(true);
    },
    clearItems: function() {
        this.menu.empty();
        this.toggleHandler(false);
    },
    setInput: function(value) {
        if(this.options.setInput) {
            this.options.setInput(this.input, value);
        }
    },
    onSelection: function(e) {
        var val = $(e.target).text();
        this.setInput(val);
        this.trigger('itemSelected', this.input.val());
    }
});

return OpenSelect;

});