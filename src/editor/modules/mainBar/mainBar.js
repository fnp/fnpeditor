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
        sandbox.publish('cmd.' + $(e.target).attr('data-cmd'));
    });

    return {
        start: function() { sandbox.publish('ready'); },
        getView: function() {return view;},
        setCommandEnabled: function(cmd, enabled) {
            view.find('[data-cmd='+cmd+']').toggleClass('disabled', !enabled);
        },
        setVersion: function(version) {
            view.find('.version').text(version);
        }
    };

};

});