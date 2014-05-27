define(function(require) {
    
'use strict';

var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    template = require('libs/text!./documentSummary.html');


var view = {
    dom: $('<div class="documentSummary"></div>'),
    init: function(config, doc) {
        this.config = config;
        this.doc = doc;
        this.template = _.template(template);

        this.doc.on('propertyChanged', this.render, this);
    },
    render: function() {
        this.dom.html(this.template({
            title: this.config.title,
            properties: this.config.properties,
            propertyValues: this.doc.properties
        }));
    },
    setDraftField: function(value) {
        this.dom.find('.draft').text(value);
    }
};

return view;

});