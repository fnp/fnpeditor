define(function(require) {
    
'use strict';

/* globals gettext */

var _ = require('libs/underscore'),
    Dialog = require('views/dialog/dialog');

var markToReplace = {
    name: 'markToReplace',
    params: {
        fragment: {type: 'context', name: 'fragment'}
    },
    stateDefaults: {
        icon: null,
        label: gettext('Mark to replace'),
        execute: function(callback, params) {
            var doc = params.fragment.document,
                dialog = Dialog.create({
                    title: gettext('Enter text to replace with'),
                    executeButtonText: gettext('Apply'),
                    cancelButtonText: gettext('Cancel'),
                    fields: [
                        {label: gettext('Text'), name: 'text', type: 'input'}
                    ]
                });


            dialog.on('execute', function(event) {
                doc.transaction(function() {
                    var wrapper = params.fragment.startNode.parent().wrapText({
                            _with: {tagName: 'span', attrs: {'class': 'answer', answer: event.formData.text}},
                            offsetStart: params.fragment.startOffset,
                            offsetEnd: params.fragment.endOffset,
                            textNodeIdx: [params.fragment.startNode.getIndex(), params.fragment.endNode.getIndex()]
                        }),
                        last = _.last(wrapper.contents());

                    return doc.createFragment(doc.CaretFragment, {node: last, offset: last.getText().length});
                }, {
                    metadata: {
                        description: gettext('Mark to replace')
                    },
                    success: function(ret) { event.success(); callback(ret);}
                });
            });
            dialog.show();

        }
    },
    getState: function(params) {
        return {
            allowed: params.fragment &&
                        params.fragment.isValid() &&
                        params.fragment instanceof params.fragment.TextRangeFragment &&
                        params.fragment.hasSameBoundries() &&
                        params.fragment.startNode.isInside('exercise.replace') &&
                        !params.fragment.startNode.isInside({tagName: 'span', klass: 'answer'}),
                        
            description: gettext('Mark selection to replacement')
        };
    }
};

var removeReplaceMark = {
    name: 'removeReplaceMark',
    params: {
        fragment: {type: 'context', name: 'fragment'}
    },
    stateDefaults: {
        icon: null,
        label: gettext('Remove replace mark'),
        execute: function(callback, params) {
            var doc = params.fragment.document;

            doc.transaction(function() {
                var ret = params.fragment.node.getParent('answer').unwrapContent();

                return doc.createFragment(doc.CaretFragment, {node:ret.element2, offset: ret.element2.getText().length});
            }, {
                metadata: {
                    description: gettext('Remove replace mark')
                },
                success: callback
            });
        }
    },
    getState: function(params) {
        return {
            allowed: params.fragment &&
                        params.fragment.isValid() &&
                        params.fragment instanceof params.fragment.NodeFragment &&
                        params.fragment.node.isInside('exercise.replace') &&
                        params.fragment.node.isInside('answer'),
                        
            description: gettext('Remove replace mark')
        };
    }
};

var editReplaceMark = {
    name: 'editReplaceMark',
    params: {
        fragment: {type: 'context', name: 'fragment'}
    },
    stateDefaults: {
        icon: null,
        label: gettext('Edit replace mark'),
        execute: function(callback, params) {
            var doc = params.fragment.document,
                answerNode = params.fragment.node.getParent('answer'),
                dialog = Dialog.create({
                    title: gettext('Edit text to replace with'),
                    executeButtonText: gettext('Apply'),
                    cancelButtonText: gettext('Cancel'),
                    fields: [
                        {label: gettext('Text'), name: 'text', type: 'input', initialValue: answerNode.getAttr('answer')}
                    ]
                });


            dialog.on('execute', function(event) {
                doc.transaction(function() {
                    answerNode.setAttr('answer', event.formData.text);
                    var node = answerNode.contents()[0];
                    return doc.createFragment(doc.CaretFragment, {node: node, offset: node.getText().length});
                }, {
                    metadata: {
                        description: gettext('Edit answer')
                    },
                    success: function(ret) { event.success(); callback(ret);}
                });
            });
            dialog.show();

        }
    },
    getState: function(params) {
        return {
            allowed: params.fragment &&
                        params.fragment.isValid() &&
                        params.fragment instanceof params.fragment.NodeFragment &&
                        params.fragment.node.isInside('exercise.replace') &&
                        params.fragment.node.isInside('answer'),
                    
            description: gettext('Mark selection to replacement')
        };
    }
};

return [markToReplace, removeReplaceMark, editReplaceMark];

});