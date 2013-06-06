define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'libs/text!./template.html'], function($, _, templateSrc) {

'use strict';

return function(sandbox) {
    
    var template = _.template(templateSrc);
    
    var view = {
        dom: $('<div>' + template({node:null, parents: null}) + '</div>'),
        setup: function() {
            this.dom.on('mouseenter', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('nodeHighlighted', target.attr('data-id'));
            });
            this.dom.on('mouseleave', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('nodeDimmed', target.attr('data-id'));
            });
            this.dom.on('click', 'a', function(e) {
                e.preventDefault();
                var target = $(e.target);
                sandbox.publish('nodeSelected', target.attr('data-id'));
            });
        },
        
        setNode: function(node) {
            this.dom.empty();
            this.dom.html(template({node: node, parents: node.parents('[wlxml-tag]')}));
        },
        
        highlightNode: function(id) {
            this.dom.find('a[data-id="'+id+'"]').addClass('rng-common-hoveredNode');
        },
        dimNode: function(id) {
            this.dom.find('a[data-id="' +id+'"]').removeClass('rng-common-hoveredNode');
        }
    }
    
    view.setup();
    
    return {
        start: function() { sandbox.publish('ready'); },
        getView: function() { return view.dom; },
        setNode: function(node) { view.setNode(node); },
        highlightNode: function(id) { view.highlightNode(id); },
        dimNode: function(id) { view.dimNode(id); }
    }
}

});