define([
'./canvas/utils',
'views/dialog/dialog',
'fnpjs/datetime'
], function(utils, Dialog, datetime) {
    
'use strict';
/* globals gettext */


var gridToggled = false;

var commands = {
    _cmds: {},
    register: function(name, command) {
        this._cmds[name] = command;
    },

    run: function(name, params, canvas, user) {
        return this._cmds[name](canvas, params, user);
    }
};

commands.register('undo', function(canvas) {
    var doc = canvas.wlxmlDocument;

    doc.undo();
});

commands.register('redo', function(canvas) {
    var doc = canvas.wlxmlDocument;

    doc.redo();
});

commands.register('remove-node', function(canvas) {
    canvas.getCurrentNodeElement().wlxmlNode.detach();
});

commands.register('unwrap-node', function(canvas) {
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd(),
        parent1 = selectionStart.element.parent() || undefined,
        parent2 = selectionEnd.element.parent() || undefined;

    var selectionAnchor = cursor.getSelectionAnchor(),
        node1 = parent1.wlxmlNode,
        node2 = parent2.wlxmlNode,
        doc = node1.document;
    if(doc.areItemsOfSameList({node1: node1, node2: node2})) {
        doc.extractItems({item1: node1, item2: node2});
        canvas.setCurrentElement(selectionAnchor.element, {caretTo: selectionAnchor.offset});
    } else if(!cursor.isSelecting()) {
        var nodeToUnwrap = cursor.getPosition().element.wlxmlNode,
            parentNode = nodeToUnwrap.unwrap();
        if(parentNode) {
            canvas.setCurrentElement(utils.findCanvasElement(parentNode));
        }
    }
});

commands.register('wrap-node', function(canvas) {
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd(),
        parent1 = selectionStart.element.parent() || undefined,
        parent2 = selectionEnd.element.parent() || undefined;

    var node1 = parent1.wlxmlNode,
        node2 = parent2.wlxmlNode,
        doc = node1.document;

    if(doc.areItemsOfSameList({node1: node1, node2: node2})) {
        doc.createList({node1: node1, node2: node2});
    }
});

commands.register('list', function(canvas, params) {
    void(params);
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd(),
        parent1 = selectionStart.element.parent() || undefined,
        parent2 = selectionEnd.element.parent() || undefined;

    var selectionFocus = cursor.getSelectionFocus();

    if(selectionStart.element.isInsideList() || selectionEnd.element.isInsideList()) {
        return;
    }

    var node1 = parent1.wlxmlNode,
        node2 = parent2.wlxmlNode,
        doc = node1.document;
    
    doc.transaction(function() {
        doc.createList({node1: node1, node2: node2, klass: params.meta === 'num' ? 'list.enum' : 'list'});
    }, {
        success: function() {
            canvas.setCurrentElement(selectionFocus.element, {caretTo: selectionFocus.offset});
        }
    });
});

commands.register('toggle-grid', function(canvas, params) {
    canvas.doc().dom().parent().toggleClass('grid-on', params.toggle);
    gridToggled = params.toggle;
});

commands.register('newNodeRequested', function(canvas, params, user) {
    var cursor = canvas.getCursor(),
        selectionStart = cursor.getSelectionStart(),
        selectionEnd = cursor.getSelectionEnd(),
        wlxmlNode, caretTo, wrapperCanvasElement;

    var insertNode = function(insertion, callback) {
        var doc = canvas.wlxmlDocument,
            metadata, creator, dialog;

        var execCallback = function(node) {
            if(callback) {
                callback(node);
            }
        };

        if(params.wlxmlTag === 'aside' && params.wlxmlClass === 'comment') {
            doc.transaction(function() {
                var node = insertion();
                if(user) {
                    creator = user.name;
                    if(user.email) {
                        creator += ' (' + user.email + ')';
                    }
                } else {
                    creator = 'anonymous';
                }

                metadata = node.getMetadata();
                metadata.add({key: 'creator', value: creator});
                metadata.add({key: 'date', value: datetime.currentStrfmt()});
                return node;
            }, {
                success: execCallback
            });
        } else if(params.wlxmlClass === 'link') {
            dialog = Dialog.create({
                title: gettext('Create link'),
                executeButtonText: gettext('Apply'),
                cancelButtonText: gettext('Cancel'),
                fields: [
                    {label: gettext('Link'), name: 'href', type: 'input'}
                ]
            });
            dialog.on('execute', function(event) {
                doc.transaction(function() {
                    var node = insertion();
                    node.setAttr('href', event.formData.href);
                    event.success();
                    return node;
                }, {
                    success: execCallback
                });
            });
            dialog.show();
        } else {
            doc.transaction(function() {
                return insertion();
            }, {success: execCallback});
        }
    };

    if(cursor.isSelecting()) {
        if(cursor.isSelectingSiblings()) {
            if(cursor.isSelectingWithinElement()) {
                wlxmlNode = selectionStart.element.wlxmlNode;
                caretTo = selectionStart.offset < selectionEnd.offset ? 'start' : 'end';

                insertNode(
                    function() {
                        return wlxmlNode.wrapWith({tagName: params.wlxmlTag, attrs: {'class': params.wlxmlClass}, start: selectionStart.offset, end: selectionEnd.offset});
                    },
                    function(wrapper) {
                        wrapperCanvasElement = utils.findCanvasElement(wrapper);
                        canvas.setCurrentElement(wrapperCanvasElement.children()[0], {caretTo: caretTo});
                    }
                );
            }
            else {
                wlxmlNode = selectionStart.element.wlxmlNode.parent();
                caretTo = selectionStart.element.sameNode(cursor.getSelectionAnchor().element) ? 'end' : 'start';

                insertNode(
                    function() {
                        return wlxmlNode.wrapText({
                            _with: {tagName: params.wlxmlTag, attrs: {'class': params.wlxmlClass}},
                            offsetStart: selectionStart.offset,
                            offsetEnd: selectionEnd.offset,
                            textNodeIdx: [wlxmlNode.indexOf(selectionStart.element.wlxmlNode), wlxmlNode.indexOf(selectionEnd.element.wlxmlNode)] //parent.childIndex(selectionEnd.element)]
                        });
                    },
                    function(wrapper) {
                        wrapperCanvasElement = utils.findCanvasElement(wrapper);
                        canvas.setCurrentElement(wrapperCanvasElement.children()[caretTo === 0 ? 0 : wrapperCanvasElement.children().length - 1], {caretTo: caretTo});
                    }
                );
            }
        } else {
            var node1 = selectionStart.element.wlxmlNode,
                node2 = selectionEnd.element.wlxmlNode,
                siblingParents = canvas.wlxmlDocument.getSiblingParents({node1: node1, node2: node2});

            if(siblingParents) {
                insertNode(
                    function() {
                        return canvas.wlxmlDocument.wrapNodes({
                            node1: siblingParents.node1,
                            node2: siblingParents.node2,
                            _with: {tagName: params.wlxmlTag, attrs: {'class': params.wlxmlClass}}
                        });
                    }
                );
            }
        }
    } else if(canvas.getCurrentNodeElement()) {
        wlxmlNode = canvas.getCurrentNodeElement().wlxmlNode;

        var linkFound = [wlxmlNode].concat(wlxmlNode.parents()).some(function(node) {
            if(node.getClass() === 'link') {
                var dialog = Dialog.create({
                    title: gettext('Edit link'),
                    executeButtonText: gettext('Apply'),
                    cancelButtonText: gettext('Cancel'),
                    fields: [
                        {label: gettext('Link'), name: 'href', type: 'input', initialValue: node.getAttr('href')},
                    ]
                });
                dialog.on('execute', function(event) {
                    canvas.wlxmlDocument.transaction(function() {
                        node.setAttr('href', event.formData.href);
                        event.success();
                    });
                    canvas.wlxmlDocument.endTransaction();
                });
                dialog.show();
                return true;
            }
        });
        if(linkFound) {
            return;
        }

        if(params.ctrlKey) {
            insertNode(
                function() {
                    return wlxmlNode.wrapWith({tagName: params.wlxmlTag, attrs: {'class': params.wlxmlClass}});
                },
                function(wrapper) {
                    canvas.setCurrentElement(utils.findCanvasElement(wrapper));
                }
            );
        } else {
            insertNode(
                function() {
                    var node = wlxmlNode.after({tagName: params.wlxmlTag, attrs: {'class': params.wlxmlClass}});
                    node.append({text:''});
                    return node;
                }, function(wrapper) {
                    canvas.setCurrentElement(utils.findCanvasElement(wrapper));
                }
            );
        }
    }
});

commands.register('footnote', function(canvas, params) {
    void(params);
    var cursor = canvas.getCursor(),
        position = cursor.getPosition(),
        asideNode, asideElement, node;
        

    if(cursor.isSelectingWithinElement()) {
        asideNode = position.element.wlxmlNode.wrapWith({tagName: 'aside', attrs:{'class': 'footnote'}, start: cursor.getSelectionStart().offset, end: cursor.getSelectionEnd().offset});
    } else {
        node = position.element.wlxmlNode;
        node.document.transaction(function() {
            asideNode = node.divideWithElementNode({tagName: 'aside', attrs:{'class': 'footnote'}}, {offset: position.offset});
            asideNode.append({text: ''});
        });
    }

    asideElement = utils.findCanvasElement(asideNode);
    asideElement.toggle(true);
    canvas.setCurrentElement(asideElement);
});

commands.register('take-away-node', function(canvas) {
    var position = canvas.getCursor().getPosition(),
        element = position.element,
        nodeElement = element ? element.parent() : canvas.getCurrentNodeElement();

    if(!nodeElement || !(nodeElement.parent())) {
        return;
    }

    var range = nodeElement.wlxmlNode.unwrapContent();

    if(element) {
        var elementIsFirstChild = nodeElement.childIndex(element);
        if(element.bound()) {
            canvas.setCurrentElement(element, {caretTo: position.offset});
        } else {
            if(elementIsFirstChild) {
                canvas.setCurrentElement(utils.findCanvasElement(range.element1), {caretTo: 'end'});
            } else {
                canvas.setCurrentElement(utils.findCanvasElement(range.element2), {caretTo: 'end'});
            }
        }
    } else {
        canvas.setCurrentElement(utils.findCanvasElement(range.element1), {caretTo: 'start'});
    }

});


return {
    run: function(name, params, canvas, user) {
        return commands.run(name, params, canvas, user);
    }
};

});