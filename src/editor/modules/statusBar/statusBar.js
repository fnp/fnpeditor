define(function(require) {
    
'use strict';
/* globals gettext */

var $ = require('libs/jquery'),
    template = require('libs/text!modules/statusBar/statusBar.html'),
    logging = require('fnpjs/logging/logging');

var logger = logging.getLogger('statusBar');

return function(sandbox){

    var view = $(template);

    return {
        start: function() {
            return sandbox.publish('ready');
        },
        getView: function() {
            return view;
        },
        showAction: function(action) {
            var state = action.getState(),
                description;
            
            if(!state) {
                description = gettext('error :(');
                logger.error('Got undefined action state: ' + action.name);
            } else {
                description = state.description;
                if(!description) {
                    description = state.allowed ? gettext('Undescribed action') : gettext('Action not allowed');
                    logger.info('Undescribed action: ' + action.name);
                }
            }

            view.text(description);
            if(!state.allowed) {
                view.prepend('<span class="badge badge-warning" style="margin-right: 5px">!</span>');
            }
        },
        clearAction: function() {
            view.text('');
        }
    };

};

});