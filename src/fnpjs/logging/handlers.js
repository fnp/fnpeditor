define(function() {
    
'use strict';


return {
    raven: function(msg, level, data) {
        /* global window */
        if(!window.Raven) {
            return;
        }

        var ravenData = {};

        if(data.exception) {
            window.Raven.captureException(data.exception);
        } else {
            Object.keys(data || {}).forEach(function(key) {
                ravenData[key] = data[key];
            });
            ravenData.tags = ravenData.tags || {};
            ravenData.tags.level = level;
            window.Raven.captureMessage(msg, ravenData);
        }
    }
};

});