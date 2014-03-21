define(function(require) {
    
'use strict';

var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    template = require('libs/text!./documentSummary.html');


var view = {
    dom: $('<div class="documentSummary"></div>'),
    init: function(config) {
        this.config = config;
        this.template = _.template(template);
    },
    render: function(properties) {
        this.dom.html(this.template({
            title: this.config.title,
            properties: this.config.properties,
            propertyValues: properties
        }));
    },
    setDraftField: function(value) {
        this.dom.find('.draft').text(value);
    }
};

return view;

});