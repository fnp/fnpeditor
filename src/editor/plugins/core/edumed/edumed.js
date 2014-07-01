define(function(require) {
    
'use strict';

var actions = require('./actions'),
    gapsActions = require('./gaps/actions'),
    orderExerciseElement = require('./order/element'),
    gapsExerciseElement = require('./gaps/element');

return {
    actions: actions.concat(gapsActions),
    canvasElements: [orderExerciseElement, gapsExerciseElement]
};

});