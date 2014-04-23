define(function(require) {

'use strict';

var _ = require('libs/underscore'),
    extension = {document: {transformations: {}, methods: {}}, wlxmlClass: {list: {methods: {}}}};


extension.wlxmlClass.list.methods = {
    itemIndex: function(listItem) {
        var toret = -1;
        this.contents('.item').some(function(item, index) {
            if(item.sameNode(listItem)) {
                toret = index;
                return true; // break
            }
        });
        return toret;
    },
    getItem: function(index) {
        return this.contents('.item')[index];
    }
};

extension.wlxmlClass.list.transformations = {
    extractAllItems: function() {
        var contents = this.contents();
        return this.document.extractItems({item1: contents[0], item2: _.last(contents)});
    }
};

extension.wlxmlClass.list.transformations = {
    extractListItems: function() {
        var contents = this.contents(),
            first = contents[0],
            last;
        if(contents.length) {
            last = contents[contents.length-1];
            this.document.extractItems({
                item1: first,
                item2: last
            });
        } else {
            this.detach();
        }
    }
};

extension.document.methods = {
    areItemsOfSameList: function(params) {
        return params.node1.parent().sameNode(params.node2.parent()) && params.node2.parent().is('list');
    }
};

extension.document.transformations.createList = {
    impl: function(params) {
        /* globals Node */
        var parent = params.node1.parent(),
            parentContents = parent.contents(),
            nodeIndexes = [params.node1.getIndex(), params.node2.getIndex()].sort(function(a,b) { return a-b; }),
            nodesToWrap = [],
            listClass = params.klass || 'list',
            listNode = params.node1.document.createDocumentNode({tagName: 'div', attrs: {'class': listClass}}),
            listPlacePtr = params.node1,
            node, i;
        
        for(i = nodeIndexes[0]; i <= nodeIndexes[1]; i++) {
            node = parentContents[i];
            if(node.nodeType === Node.TEXT_NODE) {
                node = node.wrapWith({tagName: 'div', attrs: {'class': 'item'}});
                if(i === nodeIndexes[0]) {
                    listPlacePtr = node;
                }
            } else {
                node.setClass('item');
            }
            nodesToWrap.push(node);
        }

        var toInsert;
        if(parent.is('list') && parent.object.itemIndex(nodesToWrap[0]) > 0) { // object api
            // var prevItem = parent.object.getItem(parent.object.itemIndex(nodesToWrap[0])-1); // object api
            // prevItem.append(listNode);
            toInsert = listNode.wrapWith({tagName: 'div', attrs: {'class': 'item'}});
        } else {
            //nodesToWrap[0].before(listNode);
            toInsert = listNode;
        }

        listPlacePtr.before(toInsert);

        nodesToWrap.forEach(function(node) {
            listNode.append(node);
        });
        return listNode;
    },
    getChangeRoot: function() {
        return this.args[0].node1.parent();
    },
    isAllowed: function() {
        return this.args[0].node1.parent().sameNode(this.args[0].node2.parent());
    }
};

extension.document.transformations.extractItems = {
    impl: function(params) {
        params = _.extend({}, {merge: true}, params);
        var list = params.item1.parent(),
            indexes = [params.item1.getIndex(), params.item2.getIndex()].sort(function(a,b) { return a-b;}),
            precedingItems = [],
            extractedItems = [],
            succeedingItems = [],
            items = list.contents(),
            listIsNested = list.parent().is('item');

        
        items.forEach(function(item, idx) {
            if(idx < indexes[0]) {
                precedingItems.push(item);
            }
            else if(idx >= indexes[0] && idx <= indexes[1]) {
                extractedItems.push(item);
            }
            else {
                succeedingItems.push(item);
            }
        });

        var reference = listIsNested ? list.parent() : list;
        if(succeedingItems.length === 0) {
            var reference_orig = reference;
            extractedItems.forEach(function(item) {
                reference.after(item);
                reference = item;
                if(!listIsNested) {
                    item.setClass('');
                }
            });
            if(precedingItems.length === 0) {
                reference_orig.detach();
            }
        } else if(precedingItems.length === 0) {
            extractedItems.forEach(function(item) {
                reference.before(item);
                if(!listIsNested) {
                    item.setClass('');
                }
            });
        } else {
            extractedItems.forEach(function(item) {
                reference.after(item);
                if(!listIsNested) {
                    item.setClass('');
                }
                reference = item;
            });
            var secondList = params.item1.document.createDocumentNode({tagName: 'div', attrs: {'class': list.getClass() || 'list'}}),
                toAdd = secondList;
            
            if(listIsNested) {
                toAdd = secondList.wrapWith({tagName: 'div', attrs: {'class':'item'}});
            }
            succeedingItems.forEach(function(item) {
                secondList.append(item);
            });

            reference.after(toAdd);
        }
        if(!params.merge && listIsNested) {
            return this.extractItems({item1: extractedItems[0], item2: extractedItems[extractedItems.length-1]});
        }
        return true;
    },
    isAllowed: function() {
        var parent = this.args[0].nodel1.parent();
        return parent.is('list') && parent.sameNode(this.args[0].node2.parent());
    }
};

return extension;


});