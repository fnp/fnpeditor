define(function(require) {
    
'use strict';
var documentElement = require('./documentElement');


var NullElement = Object.create(documentElement.DocumentNodeElement.prototype);

NullElement.init = function() {
    this.dom = null;
    this.wlxmlNode.setData('canvasElement', undefined);
};

return NullElement;

});