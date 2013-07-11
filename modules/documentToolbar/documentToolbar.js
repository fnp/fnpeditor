define(['libs/jquery-1.9.1.min', 'libs/underscore-min', 'libs/text!./template.html'], function($, _, template) {

'use strict';

return function(sandbox) {
    
    var view = {
        node: $(_.template(template)()),
        setup: function() {
            var view = this;
            
            this.node.find('button').click(function(e) {
                e.stopPropagation();
                var btn = $(e.currentTarget),
                    btnName = btn.attr('data-name'),
                    meta = btn.attr('data-meta'),
                    params = {},
                    command = btnName;

                if(btn.attr('data-btn-type') === 'toggle') {
                    command = 'toggle-' + command;
                    btn.toggleClass('active');
                    params.toggle = btn.hasClass('active');
                }

                if(btnName === 'new-node') {
                    command = 'newNodeRequested';
                    params.wlxmlTag = view.getOption('newTag-tag');
                    params.wlxmlClass = view.getOption('newTag-class');
                    if(meta) {
                        var split = meta.split('/');
                        params.wlxmlTag = split[0];
                        params.wlxmlClass = split[1];
                    }
                } else {
                    params.meta = meta;
                }

                sandbox.publish('command', command, params);
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