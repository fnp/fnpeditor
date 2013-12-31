define(function() {

'use strict';


var formatterFromFormatString = function(formatString) {
    return function(record) {
        var message = formatString
                .replace('%level', record.level || '-')
                .replace('%message', record.originalMessage)
                .replace('%logger', record.loggerName),
            currentDate;
        if(formatString.indexOf('%datetime') !== -1) {
            currentDate = new Date();
            message = message.replace('%datetime', + currentDate.getDate() + '-' +
                            (currentDate.getMonth() + 1)  + '-' +
                            currentDate.getFullYear() + ' ' +
                            currentDate.getHours() + ':' +
                            currentDate.getMinutes() + ':' +
                            currentDate.getSeconds()
                            );
        }
        return message;
    };
};

return {
    fromFormatString: formatterFromFormatString,
    simple: formatterFromFormatString('[%level] %datetime (%logger) - %message'),
    noop: formatterFromFormatString('%message')
};

});
