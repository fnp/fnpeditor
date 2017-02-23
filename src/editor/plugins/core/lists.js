define(function() {
    
'use strict';
/* globals gettext, interpolate */


var getBoundariesForAList = function(fragment) {
    var node;

    if(fragment instanceof fragment.RangeFragment && fragment.hasSiblingBoundaries()) {
        return fragment.startNode.hasSameContextRoot(fragment.endNode) && fragment.boundariesSiblingParents();
    }
    if(fragment instanceof fragment.NodeFragment) {
        node = fragment.node.getNearestElementNode();
        if(node.isContextRoot()) {
            node = fragment.node;
        }

        return {
            node1: node,
            node2: node
        };
    }
};

var countItems = function(boundaries) {
    var ptr = boundaries.node1,
        c = 1;
    while(ptr && !ptr.sameNode(boundaries.node2)) {
        c++;
        ptr = ptr.next();
    }
    return c;
};

var toggleListAction = function(type) {
    
    var execute = {
        add: function(callback, params) {
            var boundaries = getBoundariesForAList(params.fragment),
                listParams = {klass: type === 'Bullet' ? 'list' : 'list.enum'},
                action = this;

            if(boundaries && boundaries.node1) {
                boundaries.node1.document.transaction(function() {
                    var iterNode = boundaries.node1;
                    while(true) {
                        if(!iterNode.is({tagName: 'div', klass: 'p'})) {
                            if(iterNode.is({tagName: 'header'})) {
                                var newNode = iterNode.setTag('div');
                                newNode.setClass('p');
                                if(iterNode.sameNode(boundaries.node1)) {
                                    boundaries.node1 = newNode;
                                }
                                if(iterNode.sameNode(boundaries.node2)) {
                                    boundaries.node2 = newNode;
                                }
                                iterNode = newNode;
                            } else {
                                throw new Error('Invalid element');
                            }
                        }
                        if(iterNode.sameNode(boundaries.node2))
                            break;
                        iterNode = iterNode.next();
                    }
                    listParams.node1 = boundaries.node1;
                    listParams.node2 = boundaries.node2;
                    var list = boundaries.node1.document.createList(listParams),
                        item1 = list.object.getItem(0),
                        text = item1 ? item1.contents()[0] : undefined, //
                        doc = boundaries.node1.document;
                    if(text) {
                        return doc.createFragment(doc.CaretFragment, {node: text, offset:0});
                    }
                }, {
                    metadata: {
                        description: action.getState().description,
                        fragment: params.fragment
                    },
                    success: callback
                });
            } else {
                throw new Error('Invalid boundaries');
            }
        },
        remove: function(callback, params) {
            /* globals Node */
            var current = params.fragment.node,
                action = this;

            if(current.parent().is('item') && current.parent().parent().is('list') && current.parent().next() === null) {
                var item = current.parent();
                var list = item.parent();
                var doc = current.document;
                doc.transaction(function() {
                    var p = list.after({tagName: 'div', attrs: {'class': 'p'}});
                    p.append({text: current.getText()});
                    item.detach();
                    if(list.contents().length === 0) {
                        list.detach();
                    }
                    return doc.createFragment(
                        doc.CaretFragment, {node: p.contents()[0], offset: params.fragment.offset});
                }, {
                    metadata: {
                        description: action.getState().description,
                        fragment: params.fragment
                    },
                    success: callback
                });
                return;
            }

            var toSearch = current.nodeType === Node.ELEMENT_NODE ? [current] : [];
            toSearch = toSearch.concat(current.parents());
            toSearch.some(function(node) {
                var doc = node.document;
                if(node.is('list')) {
                    doc.transaction(function() {
                        var firstItem = node.object.extractListItems(),
                            toret;
                        if(params.fragment.isValid()) {
                            toret = params.fragment;
                        } else {
                            toret = doc.createFragment(doc.NodeFragment, {node: firstItem});
                        }
                        return toret;
                    }, {
                        metadata: {
                            description: action.getState().description,
                            fragment: params.fragment
                        },
                        success: callback
                    });
                    
                    return true; // break
                }
            }.bind(this));
        },
        changeType: function(callback, params) {
            var node = params.fragment.node,
                action = this;
            node.document.transaction(function() {
                var list = node.getParent('list');
                list.setClass(type === 'Bullet' ? 'list' : 'list.enum');
                if(params.fragment.isValid()) {
                    return params.fragment;
                } else {
                    return node.document.createFragment(node.document.NodeFragment, {node: list.contents()[0]});
                }
            }, {
                metadata: {
                    description: action.getState().description,
                    fragment: params.fragment
                },
                success: callback
            });
        }
    };

    var isToggled = function(params) {
        if(params.fragment && params.fragment.node && params.fragment.node.isInside('list')) {
            var list = params.fragment.node.getParent('list');
            return list.getClass() === (type === 'Bullet' ? 'list' : 'list.enum');
        }
        return false;
    };

    var label = type === 'Bullet' ? gettext('bull. list') : gettext('num. list');

    return {
        name: 'toggle' + type + 'List',
        context: ['fragment'],
        params: {
            fragment: {type: 'context', name: 'fragment'}
        },
        stateDefaults: {
            label: label
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
                        description: interpolate(gettext('Change list type to %s'), [label]),
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
            var boundaries = getBoundariesForAList(params.fragment);
            if(boundaries && boundaries.node1.hasSameContextRoot(boundaries.node2)) {
                var iterNode = boundaries.node1;
                while(true) {
                    if(!iterNode.is({tagName: 'div', klass: 'p'}) && !iterNode.is({tagName: 'header'})) {
                        return {
                            allowed: false,
                            description: gettext('Invalid element for a list item')
                        }
                    }
                    if(iterNode.sameNode(boundaries.node2))
                        break;
                    iterNode = iterNode.next();
                }

                return {
                    allowed: true,
                    description: interpolate(gettext('Make %s fragment(s) into list'), [countItems(getBoundariesForAList(params.fragment))]),
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