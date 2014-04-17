define(function(require) {
    
'use strict';
/* globals gettext */

var _ = require('libs/underscore'),
    templates = require('plugins/core/templates'),
    footnote = require('plugins/core/footnote'),
    switchTo = require('plugins/core/switch'),
    lists = require('plugins/core/lists'),
    plugin = {name: 'core', actions: [], canvas: {}, documentExtension: {textNode: {}}},
    Dialog = require('views/dialog/dialog');


plugin.documentExtension.textNode.transformations = {
    breakContent: {
        impl: function(args) {
            var node = this,
                newNodes, emptyText;
            newNodes = node.split({offset: args.offset});
            [newNodes.first, newNodes.second].some(function(newNode) {
                if(!(newNode.contents().length)) {
                    emptyText = newNode.append({text: ''});
                    return true; // break
                }
            });
            return _.extend(newNodes, {emptyText: emptyText});
        },
        getChangeRoot: function() {
            return this.context.parent().parent();
        }
    },
    mergeContentUp: function() {
        var myPrev = this.prev(),
            ret;

        if(myPrev) {
            ret = myPrev.append(this);
            return {node: ret, offset: ret.sameNode(this) ? null : ret.getText().length - this.getText().length};
        } else {
            var range = this.parent().unwrapContent();
            return {node: range.element1, offset: 0};
        }
    }
};

var undoRedoAction = function(dir) {
    return {
        name: dir,
        params: {
            document: {type: 'context', name: 'document'},
        },
        stateDefaults: {
            label: dir === 'undo' ? '<-' : '->',
            icon: 'share-alt',
            iconStyle: dir === 'undo' ? '-webkit-transform: scale(-1,1); transform: scale(-1, 1)' : '',
            execute: function(params) {
                params.document[dir]();
            },
        },
        getState: function(params) {
            var allowed = params.document && !!(params.document[dir+'Stack'].length),
                desc = dir === 'undo' ? gettext('Undo') : gettext('Redo'),
                descEmpty = dir === 'undo' ? gettext('There is nothing to undo') : gettext('There is nothing to redo');
            if(allowed) {
                var metadata = _.last(params.document[dir+'Stack']).metadata;
                if(metadata) {
                    desc += ': ' + (metadata.description || gettext('unknown operation'));
                }
            }
            return {
                allowed: allowed,
                description: allowed ? desc : descEmpty
            };
        }
    };
};

var pad = function(number) {
    if(number < 10) {
        number = '0' + number;
    }
    return number;
};

var commentAction = {
    name: 'comment',
    params: {
        fragment: {type: 'context', name: 'fragment'}
    },
    stateDefaults: {
        icon: 'comment',
        execute: function(params, editor) {
            /* globals Node */
            var node = params.fragment.node,
                action = this;
            if(node.nodeType === Node.TEXT_NODE) {
                node = node.parent();
            }
            node.document.transaction(function() {
                var comment =  node.after({tagName: 'aside', attrs: {'class': 'comment'}});
                comment.append({text:''});
                var user = editor.getUser(), creator;
                if(user) {
                    creator = user.name;
                    if(user.email) {
                        creator += ' (' + user.email + ')';
                    }
                } else {
                    creator = 'anonymous';
                }

                var currentDate = new Date(),
                    dt = pad(currentDate.getDate()) + '-' +
                                pad((currentDate.getMonth() + 1))  + '-' +
                                pad(currentDate.getFullYear()) + ' ' +
                                pad(currentDate.getHours()) + ':' +
                                pad(currentDate.getMinutes()) + ':' +
                                pad(currentDate.getSeconds());

                var metadata = comment.getMetadata();
                metadata.add({key: 'creator', value: creator});
                metadata.add({key: 'date', value: dt});
            }, {
                metadata: {
                    description: action.getState().description
                }
            });
        },
    },
    getState: function(params) {
        var state = {
            allowed: params.fragment && params.fragment.isValid() &&
                        params.fragment instanceof params.fragment.NodeFragment && !params.fragment.node.isRoot()
        };
        if(state.allowed) {
            state.description = gettext('Insert comment after current node');
        }
        return state;
    }
};


var createWrapTextAction = function(createParams) {
    return {
        name: createParams.name,
        params: {
            fragment: {type: 'context', name: 'fragment'},
        },
        getState: function(params) {
            var state = {
                    label: this.config.label
                },
                parent;
            
            if(
                !params.fragment || !params.fragment.isValid() ||
                !(params.fragment instanceof params.fragment.TextRangeFragment) ||
                !params.fragment.hasSiblingBoundries()) {
                    return _.extend(state, {allowed: false});
            }
            
            parent = params.fragment.startNode.parent();
            if(parent && parent.is(createParams.klass) || parent.isInside(createParams.klass)) {
                return _.extend(state, {allowed: false});
            }

            return _.extend(state, {
                allowed: true,
                description: createParams.description,
                execute: function(params) {
                    params.fragment.document.transaction(function() {
                        var parent = params.fragment.startNode.parent();
                        return parent.wrapText({
                            _with: {tagName: 'span', attrs: {'class': createParams.klass}},
                            offsetStart: params.fragment.startOffset,
                            offsetEnd: params.fragment.endOffset,
                            textNodeIdx: [params.fragment.startNode.getIndex(), params.fragment.endNode.getIndex()]
                        });
                    }, {
                        metadata: {
                            description: createParams.description
                        }
                    });
                }
            });
        }
    };
};


var createLinkFromSelection = function(params) {
    var doc = params.fragment.document,
        dialog = Dialog.create({
            title: gettext('Create link'),
            executeButtonText: gettext('Apply'),
            cancelButtonText: gettext('Cancel'),
            fields: [
                {label: gettext('Link'), name: 'href', type: 'input'}
            ]
        }),
        action = this;
    
    dialog.on('execute', function(event) {
        doc.transaction(function() {
            var span =  params.fragment.startNode.parent().wrapText({
                _with: {tagName: 'span', attrs: {'class': 'link'}},
                offsetStart: params.fragment.startOffset,
                offsetEnd: params.fragment.endOffset,
                textNodeIdx: [params.fragment.startNode.getIndex(), params.fragment.endNode.getIndex()]
            });
            span.setAttr('href', event.formData.href);
            event.success();
            return span;
        }, {
            metadata: {
                description: action.getState().description
            }
        });
    });
    dialog.show();
};

var editLink = function(params) {
    var doc = params.fragment.document,
        link = params.fragment.node.getParent('link'),
        dialog = Dialog.create({
            title: gettext('Edit link'),
            executeButtonText: gettext('Apply'),
            cancelButtonText: gettext('Cancel'),
            fields: [
                {label: gettext('Link'), name: 'href', type: 'input', initialValue: link.getAttr('href')}
            ]
        }),
        action = this;
    
    dialog.on('execute', function(event) {
        doc.transaction(function() {
            link.setAttr('href', event.formData.href);
            event.success();
        }, {
            metadata: {
                description: action.getState().description
            }
        });
    });
    dialog.show();
};

var linkAction = {
    name: 'link',
    params: {
        fragment: {type: 'context', name: 'fragment'}
    },
    stateDefaults: {
        label: gettext('link')
    },
    getState: function(params) {
        if(!params.fragment || !params.fragment.isValid()) {
            return {allowed: false};
        }

        if(params.fragment instanceof params.fragment.TextRangeFragment) {
            if(!params.fragment.hasSiblingBoundries() || params.fragment.startNode.parent().is('link')) {
                return {allowed: false};
            }
            return {
                allowed: true,
                description: gettext('Create link from selection'),
                execute: createLinkFromSelection
            };
        }

        if(params.fragment instanceof params.fragment.CaretFragment) {
            if(params.fragment.node.isInside('link')) {
                return {allowed: true, toggled: true, execute: editLink};
            }
        }
        return {allowed: false};
    }
};


plugin.actions = [
    undoRedoAction('undo'),
    undoRedoAction('redo'),
    commentAction,
    createWrapTextAction({name: 'emphasis', klass: 'emp', description: gettext('Mark as emphasized')}),
    createWrapTextAction({name: 'cite', klass: 'cite', description: gettext('Mark as citation')}),
    linkAction
].concat(plugin.actions, templates.actions, footnote.actions, switchTo.actions, lists.actions);



plugin.config = function(config) {
    // templates.actions[0].config(config.templates);
    templates.actions[0].params.template.options = config.templates;
};

return plugin;

});