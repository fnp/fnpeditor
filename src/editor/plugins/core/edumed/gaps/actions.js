define(function(require) {
    
'use strict';

/* globals gettext */

var _ = require('libs/underscore');


var createGap = {
    name: 'createGap',
    params: {
        fragment: {type: 'context', name: 'fragment'}
    },
    stateDefaults: {
        icon: null,
        label: gettext('Create a gap'),
        execute: function(callback, params) {
            var doc = params.fragment.document;

            doc.transaction(function() {
                var wrapper = params.fragment.startNode.parent().wrapText({
                        _with: {tagName: 'aside', attrs: {'class': 'gap'}},
                        offsetStart: params.fragment.startOffset,
                        offsetEnd: params.fragment.endOffset,
                        textNodeIdx: [params.fragment.startNode.getIndex(), params.fragment.endNode.getIndex()]
                    }),
                    last = _.last(wrapper.contents());

                return doc.createFragment(doc.CaretFragment, {node: last, offset: last.getText().length});
            }, {
                metadata: {
                    description: gettext('Create a gap')
                },
                success: callback
            });
        }
    },
    getState: function(params) {
        return {
            allowed: params.fragment &&
                        params.fragment.isValid() &&
                        params.fragment instanceof params.fragment.TextRangeFragment &&
                        params.fragment.hasSiblingBoundaries() &&
                        params.fragment.startNode.isInside('exercise.gap') &&
                        !params.fragment.startNode.isInside({tagName: 'aside', klass: 'gap'}),
                        
            description: gettext('Turn selection into a gap')
        };
    }
};

var removeGap = {
    name: 'removeGap',
    params: {
        fragment: {type: 'context', name: 'fragment'}
    },
    stateDefaults: {
        icon: null,
        label: gettext('Remove a gap'),
        execute: function(callback, params) {
            var doc = params.fragment.document;

            doc.transaction(function() {
                var ret = params.fragment.node.getParent('gap').unwrapContent();

                return doc.createFragment(doc.CaretFragment, {node:ret.element2, offset: ret.element2.getText().length});
            }, {
                metadata: {
                    description: gettext('Remove a gap')
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
                        params.fragment.node.isInside('exercise.gap') &&
                        params.fragment.node.isInside('gap'),
                        
            description: gettext('Remove a gap')
        };
    }
};


return [createGap, removeGap];

});