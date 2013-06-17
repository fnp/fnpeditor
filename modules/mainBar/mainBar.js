define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'libs/text!./template.html'], function($, _, template) {

'use strict';

return function(sandbox) {

    var view = $(_.template(template)());
    view.find('button').click(function(e) {
        e.preventDefault();
        sandbox.publish('cmd.' + $(e.target).attr('data-cmd'));
    })

    return {
        start: function() { sandbox.publish('ready'); },
        getView: function() {return view;},
        setCommandEnabled: function(cmd, enabled) {
            view.find('[data-cmd='+cmd+']').toggleClass('disabled', !enabled);
        },
        setVersion: function(version) {
            view.find('.version').text(version);
        }
    }

};

});