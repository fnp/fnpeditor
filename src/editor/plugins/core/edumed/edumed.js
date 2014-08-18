define(function(require) {
    
'use strict';

var actions = require('./actions'),
    gapsActions = require('./gaps/actions'),
    replaceActions = require('./replace/actions'),
    assignExerciseElement = require('./assign/element'),
    orderExerciseElement = require('./order/element'),
    gapsExerciseElement = require('./gaps/element'),
    replaceExerciseElement = require('./replace/element'),
    choiceExerciseElements = require('./choice/element');

return {
    actions: actions.concat(gapsActions).concat(replaceActions),
    canvasElements: [
        assignExerciseElement,
        orderExerciseElement,
        gapsExerciseElement,
        replaceExerciseElement
    ].concat(choiceExerciseElements)
};

});