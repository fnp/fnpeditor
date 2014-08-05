define(function() {
    
'use strict';

/* globals gettext */


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
                    var exerciseNode = node.after(node.document.edumedCreateExerciseNode(actionConfig.exercise));

                    //@@
                    if(actionConfig.exercise === 'order') {
                        exerciseNode.object.addItem('first item');
                        exerciseNode.contents('.p')[0].append({text: 'Write here...'});
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
    createAction({name: 'insertOrderExercise', icon: 'random', exercise: 'order', exerciseTitle: gettext('Order') })
];

});