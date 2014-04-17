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
                    label: this.config.label
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
                toSwitch = node;

            if(!toSwitch.is(createParams.from)) {
                toSwitch = toSwitch.getParent(createParams.from);
            }

            description = 'Switch to ' + createParams.to.name;
            return _.extend(state, {
                allowed: !!toSwitch,
                toggled: alreadyInTarget,
                description: description,
                execute: alreadyInTarget ? function() {} : function() {
                    f.document.transaction(function() {
                        if(createParams.to.tagName) {
                            toSwitch = toSwitch.setTag(createParams.to.tagName);
                        }
                        if(!_.isUndefined(createParams.to.klass)) {
                            toSwitch.setClass(createParams.to.klass);
                        }
                    }, {
                        metadata: {
                            description: description
                        }
                    });
                }
            });
        }
    };
};


return {
    actions: [
        createSwitchAction({name: 'switchToHeader', from: {tagName: 'div', klass: 'p'}, to: {tagName: 'header', klass: '', name: gettext('header')}}),
        createSwitchAction({name: 'switchToParagraph', from: {tagName: 'header'}, to: {tagName: 'div', klass: 'p', name: gettext('paragraf')}})
    ]
};

});