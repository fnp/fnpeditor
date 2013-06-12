define([
'libs/text!./template.html',
'libs/jquery-1.9.1.min',
'libs/underscore-min',

], function(templateSrc, $, _) {

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
        setNode: function(node) {
            view.find('.rng-module-nodePane-tagSelect').val(node.tag);
            view.find('.rng-module-nodePane-classSelect').val(node.klass);
        }
    }
    
}

});