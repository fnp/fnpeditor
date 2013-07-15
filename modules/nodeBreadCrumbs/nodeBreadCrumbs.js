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
            var view = this;
            this.dom.on('mouseenter', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('elementEntered', target.data('element'));
            });
            this.dom.on('mouseleave', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('elementLeft', target.data('element'));
            });
            this.dom.on('click', 'a', function(e) {
                e.preventDefault();
                var target = $(e.target);
                sandbox.publish('elementClicked', target.data('element'));
            });
        },
        
        setNodeElement: function(nodeElement) {
            this.dom.empty();
            this.currentNodeElement = nodeElement;
            var parents = nodeElement.parents();
            this.dom.html(template({node: nodeElement, parents: parents}));

            this.dom.find('li > a[href="#"]').each(function(idx, a) {
                $(a).data('element', parents[parents.length - 1 - idx]);
            });
            this.dom.find('a.active').data('element', nodeElement);
        },
        
        highlightNode: function(node) {
            this.dom.find('a[data-id="'+node.id+'"]').addClass('rng-common-hoveredNode');
        },
        dimNode: function(node) {
            this.dom.find('a[data-id="'+node.id+'"]').removeClass('rng-common-hoveredNode');
        }
    };
    
    view.setup();
    
    return {
        start: function() { sandbox.publish('ready'); },
        getView: function() { return view.dom; },
        setNodeElement: function(nodeElement) {
            if(!nodeElement.sameNode(view.currentNodeElement)) {
                view.setNodeElement(nodeElement);
            }
        },
        highlightNode: function(id) { view.highlightNode(id); },
        dimNode: function(id) { view.dimNode(id); }
    };
};

});