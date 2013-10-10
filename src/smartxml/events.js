define([

], function() {

'use strict';


var ChangeEvent = function(type, meta) {
    this.type = type;
    this.meta = meta;
};


return {
    ChangeEvent: ChangeEvent
};

});