define(function(require) {
    
'use strict';

/* globals gettext */

var _ = require('libs/underscore');

var elementBase = require('plugins/core/edumed/elementBase'),
    OrderExerciseView = require('./view');

var OrderExerciseElement = Object.create(elementBase);
_.extend(OrderExerciseElement, {
    init: function() {
        elementBase.init.call(this);
        
        this.view = new OrderExerciseView(this, this.wlxmlNode);
        this._container().append(this.view.dom);

        this.view.on('newItemRequested', function() {
            this.wlxmlNode.document.transaction(function() {
                var textNode = this.wlxmlNode.object.addItem('');
                var doc = this.wlxmlNode.document;
                return doc.createFragment(doc.CaretFragment, {node: textNode, offset:0});
            }.bind(this), {
                metadata: {
                    description: gettext('Add item to exercise')
                },
                success: function(ret) {
                    this.canvas.select(ret);
                }.bind(this)
            });
        }.bind(this));

        this.view.on('moveAnswer', function(sourceItem, targetItem, where) {
            this.wlxmlNode.document.transaction(function() {
                sourceItem.setAnswer(targetItem.getAnswer() + (where === 'before' ? 0 : 1));
            }, {
                metadata: {
                    description: gettext('Change solution')
                }
            });
        }.bind(this));

        this.view.on('moveItem', function(sourceItem, targetItem, where) {
            this.wlxmlNode.document.transaction(function() {
                targetItem.node[where](sourceItem.node);
            }, {
                metadata: {
                    description: gettext('Change order')
                }
            });
            
        }.bind(this));

        this.view.on('shuffleItems', function () {
            this.wlxmlNode.document.transaction(function() {
                this.shuffleItems();
            }.bind(this), {
                metadata: {
                    description: gettext('Set random order')
                }
            });
        }.bind(this));

        var exerciseNode = this.wlxmlNode;
        this.createContainer(this.wlxmlNode.object.getDescription(), {
            resetBackground: true,
            manages: function(node, removedFrom) {
                if(node.is('list.orderable') || (removedFrom && removedFrom.is('list.orderable'))) {
                    return false;
                }
                return exerciseNode.sameNode(node.parent() || removedFrom); //!n.hasFollowingSibing(this.params.listnode);    
            },
            dom: this.view.dom.find('.description')
        });

        this.reloadView();
    },
    onNodeAdded: function(event) {
        var node = event.meta.node;
        if(this.wlxmlNode.object.isItemNode(node)) {
            this.reloadView();
        }
    },
    onNodeAttrChange: function(event) {
        var node = event.meta.node;
        if(node.is('item.answer') && node.parent() && node.parent().is('list.orderable')) {
            this.reloadView();
        }
    },
    onNodeDetached: function(event) {
        var node = event.meta.node;
        if(node.is('item.answer') && event.meta.parent && event.meta.parent.is('list.orderable')) {
            this.reloadView();
            this.updateNumbers();
        }
    },
    reloadView: function() {
        this.view.clearItems();
        this.wlxmlNode.object.getItems().forEach(function(item) {
            this.view.addItem(item);
        }.bind(this));
    },
    updateNumbers: function () {
        var answer = 1;
        this.view.sortedItemViews().forEach(function (itemView) {
            itemView.item.setAnswer(answer);
            answer++;
        })
    },
    shuffleItems: function () {
        var items = this.wlxmlNode.object.getItems();
        var currentIndex = items.length, randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            items[currentIndex].node.after(items[randomIndex].node);
        }
        this.reloadView();
    },
    getVerticallyFirstTextElement: function() {
        var toret;
        this.containers.some(function(container) {
            toret = container.getVerticallyFirstTextElement();
            return !!toret;
        });
        return toret;
    }
});

return {tag: 'div', klass: 'exercise.order', prototype: OrderExerciseElement};

});
