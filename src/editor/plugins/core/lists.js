define(function() {
    
'use strict';
/* globals gettext, interpolate */


var getBoundriesForAList = function(fragment) {
    var node;

    if(fragment instanceof fragment.RangeFragment && fragment.hasSiblingBoundries()) {
        return fragment.boundriesSiblingParents();
    }
    if(fragment instanceof fragment.NodeFragment) {
        node = fragment.node.getNearestElementNode();
        return {
            node1: node,
            node2: node
        };
    }
};

var countItems = function(boundries) {
    var ptr = boundries.node1,
        c = 1;
    while(ptr && !ptr.sameNode(boundries.node2)) {
        c++;
        ptr = ptr.next();
    }
    return c;
};

var toggleListAction = function(type) {
    
    var execute = {
        add: function(params) {
            var boundries = getBoundriesForAList(params.fragment),
                listParams = {klass: type === 'Bullet' ? 'list' : 'list.enum'};
            if(boundries && boundries.node1) {
                listParams.node1 = boundries.node1;
                listParams.node2 = boundries.node2;
                boundries.node1.document.createList(listParams);
            } else {
                throw new Error('Invalid boundries');
            }
        },
        remove: function(params) {
            /* globals Node */
            var current = params.fragment.node;

            var toSearch = current.nodeType === Node.ELEMENT_NODE ? [current] : [];
            toSearch = toSearch.concat(current.parents());
            toSearch.some(function(node) {
                if(node.is('list')) {
                    node.object.extractListItems();
                    return true; // break
                }
            });
        },
        changeType: function(params) {
            params.fragment.node.getParent('list').setClass(type === 'Bullet' ? 'list' : 'list.enum');
        }
    };

    var isToggled = function(params) {
        if(params.fragment && params.fragment.node && params.fragment.node.isInside('list')) {
            var list = params.fragment.node.getParent('list');
            return list.getClass() === (type === 'Bullet' ? 'list' : 'list.enum');
        }
        return false;
    };


    return {
        name: 'toggle' + type + 'List',
        context: ['fragment'],
        params: {
            fragment: {type: 'context', name: 'fragment'}
        },
        stateDefaults: {
            label: type === 'Bullet' ? gettext('bull. list') : gettext('num. list')
        },
        getState: function(params) {
            if(!params.fragment || !params.fragment.isValid()) {
                return false;
            }

            if(params.fragment instanceof params.fragment.CaretFragment && params.fragment.node.isInside('list')) {
                var list = params.fragment.node.getParent('list');
                if((list.getClass() === 'list' && type === 'Enum') || (list.getClass() === 'list.enum' && type === 'Bullet')) {
                    return {
                        allowed: true,
                        description: interpolate(gettext('Change list type to %s'), [type]),
                        execute: execute.changeType
                    };
                }
                return {
                    allowed: true,
                    toggled: isToggled(params),
                    description: gettext('Remove list'),
                    execute: execute.remove
                };

            }
            var boundries = getBoundriesForAList(params.fragment);
            if(boundries) {
                return {
                    allowed: true,
                    description: interpolate(gettext('Make %s fragment(s) into list'), [countItems(getBoundriesForAList(params.fragment))]),
                    execute: execute.add
                };
            }
        }
    };
};


return {
    actions: [toggleListAction('Bullet'), toggleListAction('Enum')]
};

});