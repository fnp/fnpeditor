define(function() {
    
'use strict';


return {
    console: function(record) {
        /* global console */
        var level = record.level,
            method, msg;
        if(console) {
            if(level === 'warning') {
                level = 'warn';
            }
            method = (typeof console[level] === 'function') ? level : 'log';
            if(record.data && record.data.exception && record.data.exception.stack) {
                msg = record.data.exception.stack;
            } else {
                msg = record.message;
            }
            console[method](msg);
        }
    },
    raven: function(record) {
        /* global window */
        if(!window.Raven) {
            return;
        }

        var ravenData = {
            level: record.level,
            logger: record.loggerName,
            tags: {}
        };

        Object.keys(record.data || {})
            .filter(function(key) {return key !== 'exception';})
            .forEach(function(key) {
                ravenData.tags[key] = record.data[key];
            });

        if(record.data && record.data.exception) {
            window.Raven.captureException(record.data.exception, ravenData);
        } else {
            window.Raven.captureMessage(record.message, ravenData);
        }
    }
};

});