define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'libs/backbone-min',
'libs/text!./stringField.html'
], function($, _, Backbone, stringFieldTpl) {

'use strict';

var templates = {
    string: _.template(stringFieldTpl)
};

var getAttrElement = function(attr) {
    var toret = $('<div>');   
    toret.append(templates.string({name: attr.name, value: attr.value}));
    return toret;
};

var MetaWidget = Backbone.View.extend({
    events: {
        'change [metaField-name]': 'onMetaFieldChange' 
    },
    initialize: function() {
        var view = this;
        this.options.attrs.forEach(function(attr) {
            view.$el.append(getAttrElement(attr));
        });
    },
    onMetaFieldChange: function(e) {
        var target = $(e.target);
        this.trigger('valueChanged', target.attr('metaField-name'), target.val());
    }
});


return {
    create: function(options) {
        return new MetaWidget(options);
    }
};

});