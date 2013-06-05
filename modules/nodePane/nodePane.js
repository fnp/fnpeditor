define([
'libs/text!./template.html',
'libs/jquery-1.9.1.min',
'libs/underscore-min',

], function(templateSrc, $, _) {

return function(sandbox) {
    
    view = $(_.template(templateSrc)());
    
    view.on('change', 'select', function(e) {
        var target = $(e.target);
        var attr = target.attr('class').split('-')[2].split('nodePane')[1].substr(0,3) === 'Tag' ? 'tag' : 'class';
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
            var tag = node.attr('wlxml-tag');
            var klass = node.attr('wlxml-class');
            view.find('.rng-module-nodePane-tagSelect').val(tag);
            view.find('.rng-module-nodePane-classSelect').val(klass);
        }
    }
    
}

});