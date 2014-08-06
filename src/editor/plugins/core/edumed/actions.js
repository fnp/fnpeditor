define(function(require) {
    
'use strict';

/* globals gettext */

var _ = require('libs/underscore');

var descriptionText = gettext('Description goes here') + '...',
    firstItemText = gettext('First item') + '...';

var createAction = function(actionConfig) {

    return {
        name: actionConfig.name,
        params: {
            fragment: {type: 'context', name: 'fragment'}
        },
        stateDefaults: {
            icon: actionConfig.icon || null,
            execute: function(callback, params) {
                /* globals Node */
                void(callback);

                var node = params.fragment.node;
                if(node.nodeType === Node.TEXT_NODE) {
                    node = node.parent();
                }

                node.document.transaction(function() {
                    var exerciseNode = node.after(node.document.edumedCreateExerciseNode(actionConfig.exercise)),
                        doc = params.fragment.document,
                        cursorTarget;

                    //@@
                    if(actionConfig.exercise === 'order') {
                        exerciseNode.object.addItem(firstItemText);
                        cursorTarget = exerciseNode.contents('.p')[0].append({text: descriptionText});
                    } else if(_.contains(['gap', 'replace'], actionConfig.exercise)) {
                        cursorTarget = _.first(exerciseNode.contents('.p'));
                        if(cursorTarget) {
                            cursorTarget = cursorTarget.append({text: ''});
                        }
                    } else if(actionConfig.exercise.split('.')[0] === 'choice') {
                        _.first(exerciseNode.find('p')).append({text: descriptionText});
                        cursorTarget = _.first(exerciseNode.find('item.answer'));
                        if(cursorTarget) {
                            cursorTarget = cursorTarget.append({text: ''});
                        }
                    }
                    if(cursorTarget) {
                        callback(doc.createFragment(doc.CaretFragment, {node: cursorTarget, offset: cursorTarget.getText().length}));
                    }
                });
                
            }
        },
        getState: function(params) {
            return {
                allowed: params.fragment && params.fragment.isValid() && params.fragment instanceof params.fragment.NodeFragment && !params.fragment.node.isInside('exercise'),
                description: gettext('Insert exercise: ' + actionConfig.exerciseTitle)
            };
        }
    };

};

return [
    createAction({name: 'insertOrderExercise', icon: 'random', exercise: 'order', exerciseTitle: gettext('Order')}),
    createAction({name: 'insertChoiceSingleExercise', icon: 'ok-circle', exercise: 'choice.single', exerciseTitle: gettext('Single choice')}),
    createAction({name: 'insertChoiceMultiExercise', icon: 'check', exercise: 'choice', exerciseTitle: gettext('Mutiple Choice')}),
    createAction({name: 'insertChoiceTrueOrFalseExercise', icon: 'adjust', exercise: 'choice.true-or-false', exerciseTitle: gettext('True or False')}),
    createAction({name: 'insertGapsExercise', icon: 'question-sign', exercise: 'gap', exerciseTitle: gettext('Gaps')}),
    createAction({name: 'insertReplaceExercise', icon: 'thumbs-down', exercise: 'replace', exerciseTitle: gettext('Replace')})
];

});
