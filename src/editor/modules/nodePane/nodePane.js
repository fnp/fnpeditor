define([
'libs/text!./template.html',
'libs/jquery',
'libs/underscore',
'modules/nodePane/metaWidget/metaWidget',
'utils/wlxml'
], function(templateSrc, $, _, metaWidget, wlxmlUtils) {

'use strict';

return function(sandbox) {
    
    var view = $(_.template(templateSrc)({tagNames: wlxmlUtils.wlxmlTagNames, classNames: wlxmlUtils.wlxmlClassNames})),
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
            var module = this;
            if(!currentNode) {
                wlxmlNodeElement.document.on('change', function(event) {
                    if(event.type === 'nodeAttrChange' && event.meta.node.sameNode(currentNode)) {
                        module.setNodeElement(currentNode);
                    }
                });
            }

            view.find('.rng-module-nodePane-tagSelect').val(wlxmlNodeElement.getTagName());

            var escapedClassName = (wlxmlNodeElement.getClass() || '').replace(/\./g, '-');
            view.find('.rng-module-nodePane-classSelect').val(escapedClassName);

            var widget = metaWidget.create({attrs:wlxmlNodeElement.getMetaAttributes()});
            widget.on('valueChanged', function(key, value) {
                wlxmlNodeElement.setMetaAttribute(key, value);
                //wlxmlNodeElement.setMetaAttribute(key, value);
            });
            view.find('.metaFields').empty().append(widget.el);

            currentNode = wlxmlNodeElement;
        }
    };
    
};

});