define([
'libs/jquery',
'libs/underscore',
'utils/wlxml',
'libs/text!./template.html'], function($, _, wlxmlUtils, templateSrc) {

'use strict';

return function(sandbox) {
    
    var template = _.template(templateSrc),
        listens = false;
    
    var view = {
        dom: $('<div>' + template({node:null, parents: null}) + '</div>'),
        setup: function() {
            this.dom.on('click', 'a', function(e) {
                e.preventDefault();
                var target = $(e.target);
                sandbox.publish('elementClicked', target.data('element'));
            });
        },
        
        setNodeElement: function(nodeElement) {
            this.dom.empty();
            this.currentNodeElement = nodeElement;
            var parents;
            if(nodeElement) {
                parents = nodeElement.parents();
            }

            this.dom.html(template({node: nodeElement, parents: parents, utils: wlxmlUtils}));

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
            if(!listens && nodeElement) {
                nodeElement.document.on('change', function() {
                    if(view.currentNodeElement && !view.currentNodeElement.isInDocument()) {
                        view.setNodeElement(null);
                    }
                });
                listens = true;
            }
            view.setNodeElement(nodeElement);
        },
        highlightNode: function(id) { view.highlightNode(id); },
        dimNode: function(id) { view.dimNode(id); }
    };
};

});