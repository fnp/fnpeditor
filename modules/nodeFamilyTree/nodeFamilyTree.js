define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'libs/text!./template.html'
], function($, _, templateSrc) {

'use strict';

return function(sandbox) {
    
    var template = _.template(templateSrc);
    
    var view = {
        dom: $('<div>' + template({children: null, parent: null}) + '</div>'),
        setup: function() {
            var view = this;
            this.dom.on('click', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('nodeSelected', view.nodes[target.attr('data-id')]);
            });
            
            this.dom.on('mouseenter', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('nodeEntered', view.nodes[target.attr('data-id')]);
            });
            this.dom.on('mouseleave', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('nodeLeft', view.nodes[target.attr('data-id')]);
            });
        },
        setNode: function(node) {
            console.log('familyTree sets node');
            var nodes = this.nodes = {};
            this.currentNode = node;
            var parentNode = node.parent();
            var parent = undefined;
            
            if(parentNode) {
                parent = {
                    repr: parentNode.getTag() + (parentNode.getClass() ? ' / ' + parentNode.getClass() : ''),
                    id: parentNode.getId()
                };
                this.nodes[parentNode.getId()] = parentNode;
            }
        
            var children = [];
            node.children().each(function() {
                var child = this;
                children.push({repr: child.getTag() + (child.getClass() ? ' / ' + child.getClass() : ''), id: child.getId()});
                nodes[child.getId()] = child;
            });
            this.dom.empty();
            this.dom.append($(template({parent: parent, children: children})));
        },
        highlightNode: function(canvasNode) {
            this.dom.find('a[data-id="'+canvasNode.getId()+'"]').addClass('rng-common-hoveredNode');
        },
        dimNode: function(canvasNode) {
            this.dom.find('a[data-id="'+canvasNode.getId()+'"]').removeClass('rng-common-hoveredNode');
        }
    };
    
    view.setup();
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        setNode: function(canvasNode) {
            if(!canvasNode.isSame(view.currentNode))
                view.setNode(canvasNode);
        },
        getView: function() {
            return view.dom;
        },
        highlightNode: function(canvasNode) {
            view.highlightNode(canvasNode);
        },
        dimNode: function(canvasNode) {
            view.dimNode(canvasNode);
        }
    };
};

});