define([
'libs/jquery',
'libs/underscore',
'utils/wlxml',
'libs/text!./template.html'
], function($, _, wlxmlUtils, templateSrc) {

'use strict';

return function(sandbox) {
    
    var template = _.template(templateSrc),
        listens = false;
    
    var startListening = function(document) {
        listens = true;
        document.on('change', function(event) {
            if(event.type === 'nodeTextChange' && event.meta.node.parent().sameNode(view.currentNodeElement)) {
                view.setElement();
            }
        }, this);
    }

    var view = {
        dom: $('<div>' + template({contents: null, parent: null}) + '</div>'),
        setup: function() {
            var view = this;
            this.dom.on('click', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('nodeClicked', target.data('element'));
            });
            
            this.dom.on('mouseenter', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('nodeEntered', target.data('element'));
            });
            this.dom.on('mouseleave', 'a', function(e) {
                var target = $(e.target);
                sandbox.publish('nodeLeft', target.data('element'));
            });
        },
        setElement: function(element) {
            element = element || this.currentNodeElement;
            console.log('familyTree sets node');
            var textElement = element.getText ? element : null,
                nodeElement = element.getText ? element.parent() : element, // TODO: better type detection
                nodeElementParent = nodeElement.parent(),
                parent;
            
            this.currentNodeElement = nodeElement;

            if(nodeElementParent) {
                parent = {
                    repr: wlxmlUtils.wlxmlTagNames[nodeElementParent.getTagName()] + (nodeElementParent.getClass() ? ' / ' + wlxmlUtils.wlxmlClassNames[nodeElementParent.getClass()] : '')
                };
            }
        
            var nodeContents = nodeElement.contents(),
                contents = [];
            nodeContents.forEach(function(child) {
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
                    contents.push({repr: _.escape(text), bold: child.sameNode(textElement)});
                } else {
                    contents.push({repr: wlxmlUtils.wlxmlTagNames[child.getTagName()] + (child.getClass() ? ' / ' + wlxmlUtils.wlxmlClassNames[child.getClass()] : '')});
                }
            });
            this.dom.empty();
            this.dom.append($(template({parent: parent, contents: contents})));

            if(parent) {
                this.dom.find('.rng-module-nodeFamilyTree-parent').data('element', nodeElementParent)
            }
            this.dom.find('li a').each(function(idx, a) {
                $(a).data('element', nodeContents[idx]);
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
            if(!listens) {
                startListening(element.document);
            }
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