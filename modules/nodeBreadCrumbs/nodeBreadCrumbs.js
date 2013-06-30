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
                sandbox.publish('nodeHighlighted', view.nodes[target.attr('data-id')]);
            });
            this.dom.on('mouseleave', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('nodeDimmed', view.nodes[target.attr('data-id')]);
            });
            this.dom.on('click', 'a', function(e) {
                e.preventDefault();
                var target = $(e.target);
                sandbox.publish('nodeSelected', view.nodes[target.attr('data-id')]);
            });
        },
        
        setNode: function(node) {
            this.dom.empty();
            var nodes = this.nodes = {};
            this.currentNode = node;
            this.nodes[node.getId()] = node;
            var parents = node.parents();
            parents.each(function() {
                var parent = this;
                nodes[parent.getId()] = parent;
            });
            this.dom.html(template({node: node, parents: parents}));
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
        setNode: function(canvasNode) {
            if(!canvasNode.isSame(view.currentNode)) {
                view.setNode(canvasNode);
            }
        },
        highlightNode: function(id) { view.highlightNode(id); },
        dimNode: function(id) { view.dimNode(id); }
    };
};

});