define([
'libs/jquery',
'libs/underscore',
'libs/text!./template.html'], function($, _, template) {

'use strict';

return function(sandbox) {

    /* globals gettext*/

    var config = sandbox.getConfig(),
        userName = config.user && config.user.name,
        view = $(_.template(template)({
            userName: userName || gettext('anonymous')
        }));

    view.find('[data-cmd]').click(function(e) {
        e.preventDefault();
        var target = $(e.target);
        if(target.hasClass('disabled')) {
            return;
        }
        sandbox.publish('cmd.' + $(e.target).attr('data-cmd'));
    });

    return {
        start: function() { sandbox.publish('ready'); },
        getView: function() {return view;},
        setCommandEnabled: function(cmd, enabled) {
            var trigger = view.find('[data-cmd='+cmd+']'),
                disabledText = trigger.attr('data-disabled-text'),
                originalContent = trigger.data('originalContent');
            trigger.toggleClass('disabled', !enabled);
            if(enabled && originalContent) {
                trigger.html(originalContent);
                trigger.removeData('originalContent');
            }
            if(!enabled && disabledText) {
                trigger.data('originalContent', trigger.html());
                trigger.text(disabledText);
            }
        }
    };

};

});