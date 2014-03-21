define(function() {
    
'use strict';

var pad = function(number) {
    if(number < 10) {
        number = '0' + number;
    }
    return number;
};

var defaultFormat = '%d-%m-%y %H:%M:%S';

return {
    strfmt: function(datetime, format) {
        format = format || defaultFormat;
        return format
            .replace('%d', pad(datetime.getDate()))
            .replace('%m', pad((datetime.getMonth() + 1)))
            .replace('%y', pad(datetime.getFullYear()))
            .replace('%H', pad(datetime.getHours()))
            .replace('%M', pad(datetime.getMinutes()))
            .replace('%S', pad(datetime.getSeconds()));
    },
    currentStrfmt: function(format) {
        return this.strfmt(new Date(), format);
    }
};

});