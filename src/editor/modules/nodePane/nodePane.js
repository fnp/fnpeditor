define([
'libs/text!./template.html',
'libs/jquery',
'libs/underscore',
'modules/nodePane/metaWidget/metaWidget',
'utils/wlxml'
], function(templateSrc, $, _, metaWidget, wlxmlUtils) {

'use strict';

return function(sandbox) {
    
    var view = $(_.template(templateSrc)({utils: wlxmlUtils})),
        listens = false,
        currentNode;
    
    view.on('change', 'select', function(e) {
        var target = $(e.target);
        var attr = target.attr('class').split('-')[3] === 'tagSelect' ? 'Tag' : 'Class',
            value = target.val().replace(/-/g, '.');
        currentNode['set' + attr](value);
    });


   
    return {
        start: function() {
            sandbox.publish('ready');
        },
        getView: function() {
            return view;
        },
        setNodeElement: function(wlxmlNodeElement) {
            if(wlxmlNodeElement) {
                var module = this;
                if(!listens) {
                    wlxmlNodeElement.document.on('change', function(event) {
                        if(event.type === 'nodeAttrChange' && event.meta.node.sameNode(currentNode)) {
                            module.setNodeElement(currentNode);
                        }
                    });
                    listens = true;
                }

                view.find('.rng-module-nodePane-tagSelect').attr('disabled', false).val(wlxmlNodeElement.getTagName());

                var escapedClassName = (wlxmlNodeElement.getClass() || '').replace(/\./g, '-');
                view.find('.rng-module-nodePane-classSelect').attr('disabled', false).val(escapedClassName);

                var attrs = _.extend(wlxmlNodeElement.getMetaAttributes(), wlxmlNodeElement.getOtherAttributes());
                var widget = metaWidget.create({attrs:attrs});
                widget.on('valueChanged', function(key, value) {
                    wlxmlNodeElement.setMetaAttribute(key, value);
                    //wlxmlNodeElement.setMetaAttribute(key, value);
                });
                view.find('.metaFields').empty().append(widget.el);
            } else {
                view.find('.rng-module-nodePane-tagSelect').attr('disabled', true).val('');
                view.find('.rng-module-nodePane-classSelect').attr('disabled', true).val('');
                view.find('.metaFields').empty();
            }
            currentNode = wlxmlNodeElement;
        }
    };
    
};

});