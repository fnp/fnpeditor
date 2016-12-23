define(function(require) {
    
'use strict';
/* globals gettext */

var _ = require('libs/underscore');


var createSwitchAction = function(createParams) {
    return  {
        name: createParams.name,
        params: {
            fragment: {type: 'context', name: 'fragment'},
        },
        getState: function(params) {
            var state = {
                    label: createParams.to.name
                },
                f = params.fragment,
                description;


            if(
                !(f && f.isValid()) ||
                !((f instanceof f.CaretFragment) || (f instanceof f.TextRangeFragment && f.getCommonParent()))
            ) {
                return _.extend(state, {
                    allowed: false,
                    description: 'wrong or no selection'
                });
            }

            var node = f instanceof f.CaretFragment ? f.node.parent() : f.getCommonParent(),
                alreadyInTarget = node.isInside(createParams.to),
                toSwitch = node,
                textNodePath = (f.node || f.startNode).getPath();

            if(!toSwitch.is(createParams.from)) {
                toSwitch = toSwitch.getParent(createParams.from);
            }

            description = gettext('Switch to') + ' ' + createParams.to.name;
            return _.extend(state, {
                allowed: !!toSwitch || alreadyInTarget,
                toggled: alreadyInTarget,
                description: description,
                execute: alreadyInTarget ? function() {} : function(callback) {
                    f.document.transaction(function() {
                        if(createParams.to.tagName) {
                            toSwitch = toSwitch.setTag(createParams.to.tagName);
                        }
                        if(!_.isUndefined(createParams.to.klass)) {
                            toSwitch.setClass(createParams.to.klass);
                        }
                        return f.document.createFragment(f.CaretFragment, {node: f.document.getNodeByPath(textNodePath), offset: f.offset});
                    }, {
                        metadata: {
                            description: description,
                            fragment: params.fragment
                        },
                        success: callback
                    });
                }
            });
        }
    };
};

var headerAction = createSwitchAction({name: 'switchToHeader', from: {tagName: 'div', klass: 'p'}, to: {tagName: 'header', klass: '', name: gettext('header')}}),
    paragraphAction = createSwitchAction({name: 'switchToParagraph', from: {tagName: 'header'}, to: {tagName: 'div', klass: 'p', name: gettext('paragraph')}}),
    imageAction = createSwitchAction({name: 'switchToImage', from: {tagName: 'div'}, to: {tagName: 'div', klass: 'img', name: gettext('image')}}),
    videoAction = createSwitchAction({name: 'switchToVideo', from: {tagName: 'div'}, to: {tagName: 'div', klass: 'video', name: gettext('video')}});

return {
    actions: [headerAction, paragraphAction, imageAction, videoAction],
    canvasActionHandler: {
        handles: [headerAction, paragraphAction, imageAction, videoAction]
        // handle: function(canvas, action, ret) {
        //     var params = {},
        //         f;
        //     if(ret && ret.node2) {
        //         f = ret.oldFragment;
        //         if(f && f instanceof f.CaretFragment) {
        //             params.caretTo = f.offset;
        //         }
        //         canvas.setCurrentElement(ret.node2, params);
        //     }
        // }
    }
};

});