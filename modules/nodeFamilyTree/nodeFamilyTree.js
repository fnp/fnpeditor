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
                sandbox.publish('elementClicked', target.data('element'));
            });
            
            this.dom.on('mouseenter', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('elementEntered', target.data('element'));
            });
            this.dom.on('mouseleave', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('elementLeft', target.data('element'));
            });
        },
        setElement: function(element) {
            console.log('familyTree sets node');
            var textElement = element.getText ? element : null,
                nodeElement = element.getText ? element.parent() : element, // TODO: better type detection
                nodeElementParent = nodeElement.parent(),
                parent;
            
            this.currentNodeElement = nodeElement;

            if(nodeElementParent) {
                parent = {
                    repr: nodeElementParent.getWlxmlTag() + (nodeElementParent.getWlxmlClass() ? ' / ' + nodeElementParent.getWlxmlClass() : '')
                };
            }
        
            var nodeChildren = nodeElement.children(),
                children = [];
            nodeChildren.forEach(function(child) {
                if(child.getText) {
                    var text = child.getText();
                    if(!text)
                        text = '<pusty tekst>';
                    else {
                        if(text.length > 13) {
                            text = text.substr(0,13) + '...';
                        }
                        text = '"' + text + '"';
                    }
                    children.push({repr: _.escape(text), bold: child.sameNode(textElement)});
                } else {
                    children.push({repr: child.getWlxmlTag() + (child.getWlxmlClass() ? ' / ' + child.getWlxmlClass() : '')});
                }
            });
            this.dom.empty();
            this.dom.append($(template({parent: parent, children: children})));

            if(parent) {
                this.dom.find('.rng-module-nodeFamilyTree-parent').data('element', nodeElementParent)
            }
            this.dom.find('li a').each(function(idx, a) {
                $(a).data('element', nodeChildren[idx]);
            });
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
        setElement: function(element) {
            if(!(element.sameNode(view.currentNodeElement)))
                view.setElement(element);
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