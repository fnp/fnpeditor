define(function() {
    
'use strict';
/* globals gettext, interpolate */


var insertTemplateAction = {
    name: 'template',
    params: {
        fragment: {type: 'context', name: 'fragment'},
        template: {type: 'select', options: []},
        ctrl: {type: 'key', key: 'ctrl'}
    },
    stateDefaults: {
        label: '+',
        icon: 'core.plus'
    },
    getState: function(params) {
        if(!(params.template && params.template.id)) {
            return {
                allowed: false,
                description: gettext('No template selected')
            };
        } else if(
            !params.fragment || !params.fragment.isValid() ||
            !(params.fragment instanceof params.fragment.NodeFragment) ||
            params.fragment.node.getNearestElementNode().isRoot()
            ) {
                return {
                    allowed: false,
                    description: gettext('Wrong node selected')
            };
        }
        return {
            allowed: true,
            description: interpolate(gettext('Insert template %s after %s'), [params.template.name, params.fragment.node.getNearestElementNode().getTagName()]),
            execute: function(params) {
                var node = params.fragment.node.getNearestElementNode();
                var toAdd = node.document.createDocumentNode(params.template.content);
                node.after(toAdd);
            }
        };
    }
};


return {
    actions: [insertTemplateAction]
};

});