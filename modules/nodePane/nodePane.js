define([
'libs/text!./template.html',
'libs/jquery',
'libs/underscore',
'modules/nodePane/metaWidget/metaWidget',
'utils/wlxml'
], function(templateSrc, $, _, metaWidget, wlxmlUtils) {

'use strict';

return function(sandbox) {
    
    var view = $(_.template(templateSrc)({tagNames: wlxmlUtils.wlxmlTagNames, classNames: wlxmlUtils.wlxmlClassNames}));
    
    view.on('change', 'select', function(e) {
        var target = $(e.target);
        var attr = target.attr('class').split('-')[3] === 'tagSelect' ? 'tag' : 'class';
        sandbox.publish('nodeElementChange', attr, target.val().replace(/-/g, '.'));
    });
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        getView: function() {
            return view;
        },
        setNodeElement: function(nodeElement) {
            view.find('.rng-module-nodePane-tagSelect').val(nodeElement.getWlxmlTag());

            var escapedClassName = (nodeElement.getWlxmlClass() || '').replace(/\./g, '-')
            view.find('.rng-module-nodePane-classSelect').val(escapedClassName);

            var widget = metaWidget.create({attrs:nodeElement.getWlxmlMetaAttrs()});
            widget.on('valueChanged', function(key, value) {
                sandbox.publish('nodeElementChange', key, value);
            });
            view.find('.metaFields').empty().append(widget.el);
        }
    };
    
};

});