define(function() {
    
'use strict';


return {
    raven: function(record) {
        /* global window */
        if(!window.Raven) {
            return;
        }

        var ravenData = {};

        if(record.data.exception) {
            window.Raven.captureException(record.data.exception);
        } else {
            Object.keys(record.data || {}).forEach(function(key) {
                ravenData[key] = record.data[key];
            });
            ravenData.tags = ravenData.tags || {};
            ravenData.tags.level = record.level;
            window.Raven.captureMessage(record.message, ravenData);
        }
    }
};

});