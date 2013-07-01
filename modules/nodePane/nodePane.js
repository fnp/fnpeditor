define([
'libs/text!./template.html',
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'modules/nodePane/metaWidget/metaWidget'
], function(templateSrc, $, _, metaWidget) {

'use strict';

return function(sandbox) {
    
    var view = $(_.template(templateSrc)());
    
    view.on('change', 'select', function(e) {
        var target = $(e.target);
        var attr = target.attr('class').split('-')[3] === 'tagSelect' ? 'tag' : 'class';
        sandbox.publish('nodeChanged', attr, target.val());
    });
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        getView: function() {
            return view;
        },
        setNode: function(canvasNode) {
            view.find('.rng-module-nodePane-tagSelect').val(canvasNode.getTag());
            view.find('.rng-module-nodePane-classSelect').val(canvasNode.getClass());

            var widget = metaWidget.create({attrs:canvasNode.getMetaAttrs()});
            widget.on('valueChanged', function(key, value) {
                sandbox.publish('nodeChanged', key, value);
            });
            view.find('.metaFields').empty().append(widget.el);
        }
    };
    
};

});