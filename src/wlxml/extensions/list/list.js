define(function(require) {

'use strict';


var wlxml = require('wlxml/wlxml'),
    extension = {documentTransformations: [], classMethods: {}};


extension.classMethods['list'] = {
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
}

extension.documentTransformations.push({
    name: 'createList',
    impl: function(params) {          
        var parent = params.node1.parent(),
            parentContents = parent.contents(),
            nodeIndexes = [params.node1.getIndex(), params.node2.getIndex()].sort(),
            nodesToWrap = [],
            listNode = params.node1.document.createDocumentNode({tagName: 'div', attrs: {'class': 'list.items'}}),
            node, i;

        for(i = nodeIndexes[0]; i <= nodeIndexes[1]; i++) {
            node = parentContents[i];
            if(node.nodeType === Node.TEXT_NODE) {
                node = node.wrapWith({tagName: 'div', attrs: {'class': 'item'}}); //t
            } else {
                node.setClass('item'); //t
            }
            nodesToWrap.push(node);
        }

        var toInsert;
        if(parent.is('list') && parent.object.itemIndex(nodesToWrap[0]) > 0) { // object api
            // var prevItem = parent.object.getItem(parent.object.itemIndex(nodesToWrap[0])-1); // object api
            // prevItem.append(listNode); //t
            toInsert = listNode.wrapWith({tagName: 'div', attrs: {'class': 'item'}});
        } else {
            //nodesToWrap[0].before(listNode); //t
            toInsert = listNode;
        }  

        params.node1.before(toInsert);

        nodesToWrap.forEach(function(node) {
            listNode.append(node); //t
        });
    },
    getChangeRoot: function() {
        return this.args.node1.parent();
    },
    isAllowed: function() {
        return this.args.node1.parent().sameNode(this.args.node2.parent());
    }
});

extension.documentTransformations.push({
    name: 'extractItems',
    impl: function(params) {
        params = _.extend({}, {merge: true}, params);
        var list = params.item1.parent(),
            indexes = [params.item1.getIndex(), params.item2.getIndex()].sort(),
            precedingItems = [],
            extractedItems = [],
            succeedingItems = [],
            items = list.contents(), // lub list.object.items()
            listIsNested = list.parent().is('item'),
            i;
        
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
                reference.after(item); //t
                reference = item;
                if(!listIsNested) {
                    item.setClass(null); //t
                }
            });
            if(precedingItems.length === 0)
                reference_orig.detach(); //t
        } else if(precedingItems.length === 0) {
            extractedItems.forEach(function(item) {
                reference.before(item); //t
                if(!listIsNested) {
                    item.setClass(null); //t
                }
            });
        } else {
            extractedItems.forEach(function(item) {
                reference.after(item); //t
                if(!listIsNested)
                    item.setClass(null); //t
                reference = item;
            });
            var secondList = params.item1.document.createDocumentNode({tagName: 'div', attrs: {'class':'list'}}),
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
            debugger;
            return this.transform('extractItems', {item1: extractedItems[0], item2: extractedItems[extractedItems.length-1]});
        }
        return true;
    },
    isAllowed: function() {
        var parent = this.args.nodel1.parent();
        return parent.is('list') && parent.sameNode(this.args.node2.parent());
    }
});

wlxml.registerExtension(extension);

// wlxml.registerClassTransformation('list', {
//     name: 'insertItem',
//     impl: function(item) {
//         if(!item.is('item')) {
//             throw new Error ('...');
//         }
//         this.append(item);
//     }
// });

// wlxml.registerClassMethod('list', {
//     name: 'items',
//     impl: function() {
//         var node = this;
//         return this.contents();    
//     }
// });

//a atrybuty? registerClassAttrs? E... lepiej registerClassExtension({methods, attibutes})

});