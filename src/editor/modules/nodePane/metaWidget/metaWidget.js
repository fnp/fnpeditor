define([
'libs/jquery',
'libs/underscore',
'libs/backbone',
'libs/text!./stringField.html'
], function($, _, Backbone, stringFieldTpl) {

'use strict';

var templates = {
    string: _.template(stringFieldTpl)
};

var getAttrElement = function(attrName, attr) {
    var toret = $('<div>');   
    toret.append(templates.string({name: attrName, value: attr.value}));
    return toret;
};

var MetaWidget = Backbone.View.extend({
    events: {
        'change [metaField-name]': 'onMetaFieldChange' 
    },
    initialize: function() {
        var view = this;
        _.keys(this.options.attrs).forEach(function(attrName) {
            view.$el.append(getAttrElement(attrName, this.options.attrs[attrName]));
        }.bind(this));
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