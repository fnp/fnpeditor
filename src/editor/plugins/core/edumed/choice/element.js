define(function(require) {
    
'use strict';

var choiceSingle = require('./choiceSingle'),
    choiceMulti = require('./choiceMulti'),
    choiceTrueOrFalse = require('./choiceTrueOrFalse');

return [
    {tag: 'div', klass: 'exercise.choice', prototype: choiceMulti},
    {tag: 'div', klass: 'exercise.choice.single', prototype: choiceSingle},
    {tag: 'div', klass: 'exercise.choice.true-or-false', prototype: choiceTrueOrFalse},
];

});
