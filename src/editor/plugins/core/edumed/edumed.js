define(function(require) {
    
'use strict';

var actions = require('./actions'),
    gapsActions = require('./gaps/actions'),
    replaceActions = require('./replace/actions'),
    orderExerciseElement = require('./order/element'),
    gapsExerciseElement = require('./gaps/element'),
    replaceExerciseElement = require('./replace/element'),
    choiceExerciseElements = require('./choice/element');

return {
    actions: actions.concat(gapsActions).concat(replaceActions),
    canvasElements: [orderExerciseElement, gapsExerciseElement, replaceExerciseElement].concat(choiceExerciseElements)
};

});