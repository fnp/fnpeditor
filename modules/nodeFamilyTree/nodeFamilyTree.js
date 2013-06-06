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
            this.dom.on('click', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('nodeSelected', target.attr('data-id'));
            });
            
            this.dom.on('mouseenter', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('nodeEntered', target.attr('data-id'));
            });
            this.dom.on('mouseleave', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('nodeLeft', target.attr('data-id'));
            });
        },
        setNode: function(node) {
            var parentClass = node.parent().attr('wlxml-class');
            var parent = node.parent('[wlxml-tag]').length ? {
                repr: node.parent().attr('wlxml-tag') + (parentClass ? ' / ' + parentClass : ''),
                id: node.parent().attr('id')
            } : undefined;
            var children = [];
            node.children('[wlxml-tag]').each(function() {
                var child = $(this);
                var childClass = child.attr('wlxml-class');
                children.push({repr: child.attr('wlxml-tag') + (childClass ? ' / ' + childClass : ''), id: child.attr('id')});
            });
            this.dom.empty();
            this.dom.append($(template({parent: parent, children: children})));
        }
    }
    
    view.setup();
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        setNode: function(node) {
            view.setNode(node);
        },
        getView: function() {
            return view.dom;
        },
        highlightNode: function(id) {
            view.dom.find('a[data-id="'+id+'"]').addClass('rng-common-hoveredNode');
        },
        dimNode: function(id) {
            view.dom.find('a[data-id="'+id+'"]').removeClass('rng-common-hoveredNode');
        }
    };
};

});