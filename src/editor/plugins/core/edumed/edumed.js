define(function(require) {
    
'use strict';

var actions = require('./actions'),
    orderExerciseElement = require('./order/element');

return {
    actions: actions,
    canvasElements: [orderExerciseElement]
};

});