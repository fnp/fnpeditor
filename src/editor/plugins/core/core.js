define(function(require) {
    
'use strict';
/* globals gettext */

var _ = require('libs/underscore'),
    templates = require('plugins/core/templates'),
    footnote = require('plugins/core/footnote'),
    switchTo = require('plugins/core/switch'),
    lists = require('plugins/core/lists'),
    plugin = {name: 'core', actions: [], canvas: {}, documentExtension: {textNode: {}, documentNode: {}}},
    Dialog = require('views/dialog/dialog'),
    canvasElements = require('plugins/core/canvasElements'),
    metadataEditor = require('plugins/core/metadataEditor/metadataEditor'),
    edumed = require('plugins/core/edumed/edumed');


plugin.documentExtension.textNode.transformations = {
    breakContent: {
        impl: function(args) {
            var node = this,
                isSpan = node.parent().getTagName() === 'span',
                parentDescribingNodes = [],
                newNodes, emptyText;
            newNodes = node.split({offset: args.offset});
            newNodes.second.contents()
                .filter(function(child) {
                    return child.object.describesParent;
                })
                .forEach(function(child) {
                    //child.detach();
                    parentDescribingNodes.push(child);
                    child.detach();
                });
            [newNodes.first, newNodes.second].some(function(newNode) {
                if(!(newNode.contents().length)) {
                    emptyText = newNode.append({text: ''});
                    return true; // break
                }
            });
            parentDescribingNodes.forEach(function(node) {
                newNodes.first.append(node);
            });

            var parent, newNode;

            var copyNode = function(n) {
                var attrs = {};
                n.getAttrs().forEach(function(attr) {
                    attrs[attr.name] = attr.value;
                });

                return node.document.createDocumentNode({
                    tagName: n.getTagName(),
                    attrs: attrs
                });
            };

            var move = function(node, to) {
                var copy;
                if(!node.containsNode(newNodes.second)) {
                    to.append(node);
                    return false;
                } else {
                    if(!node.sameNode(newNodes.second)) {
                        copy = to.append(copyNode(node));
                        node.contents().some(function(n) {
                            return move(n, copy);
                        });
                    }
                    return true;
                }
            };

            if(isSpan) {
                newNodes.first.parents().some(function(p) {
                    if(p.getTagName() !== 'span') {
                        parent = p;
                        return true;
                    }
                });
                newNode = parent.before({tagName: parent.getTagName(), attrs: {'class': parent.getClass()}});
                parent.contents().some(function(n) {
                    return move(n, newNode);
                });
            }

            return _.extend(newNodes, {emptyText: emptyText});
        }
    },
    mergeContentUp: function() {
        /* globals Node */
        var myPrev = this,
            base = this,
            ret;

        if(myPrev.nodeType === Node.TEXT_NODE) {
            if(myPrev.getIndex() > 0) {
                return;
            }
            myPrev = base = myPrev.parent();
        }

        myPrev = myPrev && myPrev.prev();

        if(myPrev && myPrev.nodeType === Node.ELEMENT_NODE)  {
            var ptr = this,
                next;
            while(ptr) {
                next = ptr.next();
                if(!ret) {
                    ret = myPrev.append(ptr);
                } else {
                    myPrev.append(ptr);
                }
                
                ptr = next;
            }
            if(base !== this) {
                base.detach();
            }
            return {node: ret, offset: ret.sameNode(this) ? null : ret.getText().length - this.getText().length};
        }
    }
};

plugin.documentExtension.documentNode.transformations = {
    moveUp: function() {
        var toMerge = this,
            prev = toMerge.prev();

        var merge = function(from, to) {
            var toret;
            from.contents().forEach(function(node, idx) {
                var len, ret;
                if(idx === 0 && node.nodeType === Node.TEXT_NODE) {
                    len = node.getText().length;
                }
                ret = to.append(node);
                
                if(idx === 0 && ret.nodeType === Node.TEXT_NODE) {
                    toret = {
                        node: ret,
                        offset: ret.getText().length - len
                    };
                } else if(!toret) {
                    toret = {
                        node: ret.getFirstTextNode(),
                        offset: 0
                    };
                }
            });
            from.detach();
            return toret;
        };

        var strategies = [
            {
                applies: function() {
                    return toMerge.nodeType === Node.TEXT_NODE && prev.is({tagName: 'span'});
                },
                run: function() {
                    var textNode = prev.getLastTextNode(),
                        txt, prevText, prevTextLen;
                    if(textNode) {
                        txt = textNode.getText();
                        if(txt.length > 1) {
                            textNode.setText(txt.substr(0, txt.length-1));
                            return {node: toMerge, offset: 0};
                        } else {
                            if((prevText = prev.prev()) && prevText.nodeType === Node.TEXT_NODE) {
                                prevTextLen = prevText.getText().length;
                            }
                            prev.detach();
                            return {
                                node: prevText ? prevText : toMerge,
                                offset : prevText ? prevTextLen : 0
                            };
                        }
                    }
                }
            },
            {
                applies: function() {
                    return toMerge.is({tagName: 'div', 'klass': 'p'}) || (toMerge.is({tagName: 'div'}) && toMerge.getClass() === '');
                },
                run: function() {
                    if(prev && (prev.is('p') || prev.is({tagName: 'header'}))) {
                        return merge(toMerge, prev);
                    }
                    if(prev && prev.is('list')) {
                        var items = prev.contents().filter(function(n) { return n.is('item');});
                        return merge(toMerge, items[items.length-1]);
                    }
                }
            },
            {
                applies: function() {
                    return toMerge.is({tagName: 'span'});
                },
                run: function() {
                    /* globals Node */
                    var toret = {node: toMerge.contents()[0] , offset: 0},
                        txt, txtNode, parent;
                    if(!prev) {
                        toMerge.parents().some(function(p) {
                            if(p.is({tagName: 'span'})) {
                                parent = prev = p;
                            } else {
                                if(!parent) {
                                    parent = p;
                                }
                                prev = prev && prev.prev();
                                return true;
                            }
                        });
                    }
                    if(!prev) {
                        return parent.moveUp();
                    }
                    else if(prev.nodeType === Node.TEXT_NODE && (txt = prev.getText())) {
                        prev.setText(txt.substr(0, txt.length-1));
                        return toret;
                    } else if(prev.is({tagName: 'span'})) {
                        if((txtNode = prev.getLastTextNode())) {
                            txt = txtNode.getText();
                            txtNode.setText(txt.substr(0, txt.length-1));
                            return toret;
                        }
                    }

                }
            },
            {
                applies: function() {
                    return toMerge.is({tagName: 'header'});
                },
                run: function() {
                    if(prev && prev.is('p') || prev.is({tagName: 'header'})) {
                        return merge(toMerge, prev);
                    }
                }
            },
            {
                applies: function() {
                    return toMerge.is('item');
                },
                run: function() {
                    var list;
                    if(prev && prev.is('item')) {
                        return merge(toMerge, prev);
                    } else if(!prev && (list = toMerge.parent()) && list.is('list')) {
                        list.before(toMerge);
                        toMerge.setClass('p');
                        if(!list.contents().length) {
                            list.detach();
                        }
                        return {node: toMerge.contents()[0], offset:0};
                    }
                }
            }
        ];

        var toret;
        strategies.some(function(strategy) {
            if(strategy.applies()) {
                toret = strategy.run();
                return true;
            }
        });
        return toret;
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
            execute: function(callback, params) {
                var metadata = _.last(params.document[dir+'Stack']).metadata,
                    fragment = metadata && metadata.fragment;
                params.document[dir]();
                if(fragment) {
                    if(!fragment.isValid()) {
                        fragment.restoreFromPaths();
                    }
                    if(fragment.isValid()) {
                        callback(fragment);
                    }
                }
                callback();
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
        execute: function(callback, params, editor) {
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
                },
                success: callback
            });
        },
    },
    getState: function(params) {
        var state = {
            allowed: params.fragment && params.fragment.isValid() &&
                        params.fragment instanceof params.fragment.NodeFragment && !params.fragment.node.isRoot()
        };
        if(state.allowed) {
            state.description = gettext('Insert comment');
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
            
            if(!params.fragment || !params.fragment.isValid()) {
                return _.extend(state, {allowed: false});
            }

            if(params.fragment instanceof params.fragment.CaretFragment && params.fragment.node.isInside(createParams.klass)) {
                return _.extend(state, {
                    allowed: true,
                    toggled: true,
                    description: createParams.unwrapDescription,
                    execute: function(callback, params) {
                        var node = params.fragment.node,
                            doc = node.document,
                            toRemove = node.getParent(createParams.klass),
                            prefLen = 0;

                        if(node.sameNode(toRemove.contents()[0]) && toRemove.isPrecededByTextNode()) {
                            prefLen = toRemove.prev().getText().length;
                        }

                        doc.transaction(function() {
                            var ret = toRemove.unwrapContent(),
                                newFragment = params.fragment;
                            if(!newFragment.isValid()) {
                                newFragment =  doc.createFragment(doc.CaretFragment, {
                                    node: ret.element1,
                                    offset: prefLen + params.fragment.offset
                                });
                            }
                            return newFragment;
                        }, {
                            metadata: {
                                description: createParams.unwrapDescription,
                                fragment: params.fragment
                            },
                            success: callback
                        });
                    }
                });
            }

            if(params.fragment instanceof params.fragment.TextRangeFragment && params.fragment.hasSiblingBoundries()) {
                parent = params.fragment.startNode.parent();
                if(parent && parent.is(createParams.klass) || parent.isInside(createParams.klass)) {
                    return _.extend(state, {allowed: false});
                }

                return _.extend(state, {
                    allowed: true,
                    description: createParams.wrapDescription,
                    execute: function(callback, params) {
                        params.fragment.document.transaction(function() {
                            var parent = params.fragment.startNode.parent(),
                                doc = params.fragment.document,
                                wrapper, lastTextNode;
                            
                            wrapper = parent.wrapText({
                                _with: {tagName: 'span', attrs: {'class': createParams.klass}},
                                offsetStart: params.fragment.startOffset,
                                offsetEnd: params.fragment.endOffset,
                                textNodeIdx: [params.fragment.startNode.getIndex(), params.fragment.endNode.getIndex()]
                            });
                                
                            lastTextNode = wrapper.getLastTextNode();
                            if(lastTextNode) {
                                return doc.createFragment(doc.CaretFragment, {node: lastTextNode, offset: lastTextNode.getText().length});
                            }
                        }, {
                            metadata: {
                                description: createParams.wrapDescription,
                                fragment: params.fragment
                            },
                            success: callback
                        });
                    }
                });
            }
            return _.extend(state, {allowed: false});
        }
    };
};


var createLinkFromSelection = function(callback, params) {
    var doc = params.fragment.document,
        dialog = Dialog.create({
            title: gettext('Create link'),
            executeButtonText: gettext('Apply'),
            cancelButtonText: gettext('Cancel'),
            fields: [
                {label: gettext('Link'), name: 'href', type: 'input',
                prePasteHandler: function(text) {
                                    return params.fragment.document.getLinkForUrl(text);
                                }.bind(this)
                }
            ]
        }),
        action = this;
    
    dialog.on('execute', function(event) {
        doc.transaction(function() {
            var span =  action.params.fragment.startNode.parent().wrapText({
                _with: {tagName: 'span', attrs: {'class': 'link', href: event.formData.href }},
                offsetStart: params.fragment.startOffset,
                offsetEnd: params.fragment.endOffset,
                textNodeIdx: [params.fragment.startNode.getIndex(), params.fragment.endNode.getIndex()]
            }),
                doc = params.fragment.document;
            event.success();
            return doc.createFragment(doc.CaretFragment, {node: span.contents()[0], offset:0});
        }, {
            metadata: {
                description: action.getState().description,
                fragment: params.fragment
            },
            success: callback
        });
    });
    dialog.show();
};

var editLink = function(callback, params) {
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
            return params.fragment;
        }, {
            metadata: {
                description: action.getState().description,
                fragment: params.fragment
            },
            success: callback
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
                return {
                    allowed: true,
                    toggled: true,
                    description: gettext('Edit link'),
                    execute: editLink
                };
            }
        }
        return {allowed: false};
    }
};

var metadataParams = {};

plugin.actions = [
    undoRedoAction('undo'),
    undoRedoAction('redo'),
    commentAction,
    createWrapTextAction({name: 'emphasis', klass: 'emp', wrapDescription: gettext('Mark as emphasized'), unwrapDescription: gettext('Remove emphasis')}),
    createWrapTextAction({name: 'cite', klass: 'cite', wrapDescription: gettext('Mark as citation'), unwrapDescription: gettext('Remove citation')}),
    linkAction,
    metadataEditor.action(metadataParams)
].concat(plugin.actions, templates.actions, footnote.actions, switchTo.actions, lists.actions, edumed.actions);


plugin.config = function(config) {
    // templates.actions[0].config(config.templates);
    templates.actions[0].params.template.options = config.templates;
    metadataParams.config = (config.metadata || []).sort(function(configRow1, configRow2) {
        if(configRow1.key < configRow2.key) {
            return -1;
        }
        if(configRow1.key > configRow2.key) {
            return 1;
        }
        return 0;
    });
};

plugin.canvasElements = canvasElements.concat(edumed.canvasElements);

return plugin;

});