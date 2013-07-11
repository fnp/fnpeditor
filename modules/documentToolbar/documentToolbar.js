define(['libs/jquery-1.9.1.min', 'libs/underscore-min', 'libs/text!./template.html'], function($, _, template) {

'use strict';

return function(sandbox) {
    
    var view = {
        node: $(_.template(template)()),
        setup: function() {
            var view = this;
            
            this.node.find('button').click(function(e) {
                e.stopPropagation();
                var btn = $(e.currentTarget);
                if(btn.attr('data-btn-type') === 'toggle') {
                    btn.toggleClass('active');
                    var event;
                    var btnId = btn.attr('data-btn');
                    if(btnId === 'grid')
                        event = 'toggleGrid';
                    if(btnId === 'tags')
                        event = 'toggleTags';
                    if(btnId === 'list')
                        event = 'toggleList'
                    sandbox.publish(event, btn.hasClass('active'));
                }
                if(btn.attr('data-btn-type') === 'cmd') {
                    var command = btn.attr('data-btn');
                    var meta = btn.attr('data-meta');
                    if(command === 'new-node') {
                        var wlxmlTag = view.getOption('newTag-tag');
                        var wlxmlClass = view.getOption('newTag-class');
                        if(meta) {
                            var split = meta.split('/');
                            wlxmlTag = split[0];
                            wlxmlClass = split[1];
                        }
                        sandbox.publish('newNodeRequested', wlxmlTag, wlxmlClass);
                    } else {
                        sandbox.publish('command', btn.attr('data-btn'), btn.attr('data-meta'));
                    }
                }
            });
        },
        getOption: function(option) {
            return this.node.find('.rng-module-documentToolbar-toolbarOption[data-option=' + option +']').val();
        }
    };
    
    view.setup();

    return {
        start: function() { sandbox.publish('ready'); },
        getView: function() { return view.node; },
        getOption: function(option) { return view.getOption(option); }
    };
};

});