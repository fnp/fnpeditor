define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    templates = {
        order: require('libs/text!./order.xml'),
        choice: require('libs/text!./choice.xml'),
        'choice.single': require('libs/text!./choiceSingle.xml'),
        'choice.true-or-false': require('libs/text!./choiceTrueOrFalse.xml'),
        gap: require('libs/text!./gaps.xml'),
        replace: require('libs/text!./replace.xml')
    };

var Item = function(node, exerciseNode) {
    Object.defineProperty(this, 'text', {
        get: function() {
            /* globals Node */
            var firstNode = node.contents()[0];
            if(firstNode && firstNode.nodeType === Node.TEXT_NODE) {
                return firstNode.getText();
            }
            return '';
        }
    });
    this.node = node;
    this.exerciseNode = exerciseNode;
};
_.extend(Item.prototype, {
    setText: function(text) {
        /* globals Node */
        var contents = this.node.contents();
        if(contents.length === 1 && contents[0].nodeType === Node.TEXT_NODE) {
            contents[0].setText(text);
        } else {
            contents.forEach(function(childNode) {
                childNode.detach();
            });
            contents.append({text: text});
        }
    },
    remove: function() {
        this.node.detach();
    },
    getAnswer: function() {
        var toret = parseInt(this.node.getAttr('answer'), 10);
        if(_.isNaN(toret)) {
            toret = 1;
        }
        return toret;
    },
    setAnswer: function(answer) {
        answer = parseInt(answer, 10);
        var prev = answer;
        if(!_.isNumber(answer)) {
            return;
        }
        
        this.exerciseNode.object.getItems()
            .sort(function(item1, item2) {
                if(item1.getAnswer() > item2.getAnswer()) {
                    return 1;
                }
                return -1;
            })
            .some(function(item) {
                if(item.getAnswer() === prev && !item.node.sameNode(this.node)) {
                    item.node.setAttr('answer', prev+1);
                    prev = prev + 1;
                }
            }.bind(this));
        this.node.setAttr('answer', answer);
        
    }
});

var isItemsList = function(node) {
    return node.is('list.orderable');
};


var extension = {wlxmlClass: {'exercise.order': {
    methods: {
        isContextRoot: function(node) {
            return this.object.isItemNode(node) || this.sameNode(node);
        },
        getItems: function() {
            var toret = [],
                exerciseNode = this;

            this.contents().some(function(node) {
                if(isItemsList(node)) {
                    node.contents()
                        .filter(function(node) {
                            return node.is('item.answer');
                        })
                        .forEach(function(node) {
                            toret.push(new Item(node, exerciseNode));
                        });
                    return true;
                }
            });
            return toret;
        },
        isItemNode: function(node) {
            var list;
            if(!node) {
                return;
            }
            this.contents().some(function(node) {
                if(isItemsList(node)) {
                    list = node;
                    return true;
                }
            });
            return list && list.sameNode(node.parent());
        },
        getDescription: function() {
            var toret = [];
            this.contents().some(function(node) {
                if(isItemsList(node)) {
                   return true;
                }
                toret.push(node);
            });
            return toret;
        }
    },
    transformations: {
        addItem: function(text) {
            var toret;
            this.contents().some(function(node) {
                if(isItemsList(node)) {
                    var itemNode = this.document.createDocumentNode({tagName: 'div', attrs: {'class': 'item.answer', answer: this.object.getItems().length+1}});
                    toret = itemNode.append({text: text});
                    node.append(itemNode);
                    return true;
                }
            }.bind(this));
            return toret;
        },
        setDescription: function(text) {
            this.contents().some(function(node) {
                var textNode;
                if(node.is('p')) {
                    textNode = node.contents()[0];
                    if(!(textNode && textNode.nodeType === Node.TEXT_NODE)) {
                        node.prepend({text:text});
                    } else {
                        textNode.setText(text);
                    }
                    return true;
                }
            });
        }
    }
}}};

var choiceMethods = {
    getChoiceList: function() {
        return this.contents()
            .filter(function(n) { return this.object.isChoiceList(n); }.bind(this))[0];
    },
    isChoiceList: function(node) {
        return node.is('list') && this.sameNode(node.parent());
    },
    isChoiceListItem: function(node) {
        return this.object.isChoiceList(node.parent()) && node.is('item.answer');
    }
};

extension.wlxmlClass['exercise.choice'] = {
    transformations: {
        setAnswer: function(itemNode, answer) {
            if(!this.object.isChoiceListItem(itemNode)) {
                return;
            }
            itemNode.setAttr('answer', answer ? 'true' : 'false');
        }
    },
    methods: choiceMethods
};

extension.wlxmlClass['exercise.choice.single'] = {
    transformations: {
        markAsAnswer: function(itemNode) {
            if(!this.object.isChoiceListItem(itemNode)) {
                return;
            }
            this.object.getChoiceList().contents()
                .filter(function(node) { return node.is('item.answer'); })
                .forEach(function(node) {
                    node.setAttr('answer', node.sameNode(itemNode) ? 'true' : 'false');
                });
        }
    },
    methods: choiceMethods
};

extension.wlxmlClass['exercise.choice.true-or-false'] = {
    transformations: {
        setAnswer: function(itemNode, answer) {
            if(!this.object.isChoiceListItem(itemNode)) {
                return;
            }
            itemNode.setAttr('answer', answer ? 'true' : 'false');
        }
    },
    methods: choiceMethods
};

extension.document = {
    methods: {
         edumedCreateExerciseNode: function(klass) {
            void(klass);
            return this.createDocumentNode(templates[klass]);
         }
    }
};

return extension;

});