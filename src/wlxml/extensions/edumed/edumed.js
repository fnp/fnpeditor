define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    templates = {
        order: require('libs/text!./order.xml'),
        choice: require('libs/text!./choice.xml'),
        'choice.single': require('libs/text!./choiceSingle.xml'),
        'choice.true-or-false': require('libs/text!./choiceTrueOrFalse.xml'),
        gap: require('libs/text!./gaps.xml'),
        replace: require('libs/text!./replace.xml'),
        assign: require('libs/text!./assign.xml')
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
    isContextRoot: function(node) {
        return this.object.isChoiceList(node.parent()) || this.sameNode(node);
    },
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

extension.wlxmlClass['exercise.gap'] = extension.wlxmlClass['exercise.replace'] = {
    methods: {
        isContextRoot: function(node) {
            return this.sameNode(node);
        }
    }
};


var SourceItem = function(node) {
    this.node = node;
};
_.extend(SourceItem.prototype, {
    assignTo: function(destinationItem) {
        var ids;
        if(!destinationItem.accepts(this)) {
            throw new Error('Cannot assign: target ids mismatch.');
        }
        ids = (this.node.getAttr('answer') || '').split(',');
        ids.push(destinationItem.getId());
        this.node.setAttr('answer', ids.filter(function(id) { return !!id; }).join(','));
    },
    removeFrom: function(destinationItem) {
        var ids;
        if(!destinationItem.accepts(this)) {
            throw new Error('Cannot assign: target ids mismatch.');
        }
        ids = (this.node.getAttr('answer') || '').split(',');
        this.node.setAttr('answer', ids.filter(function(id) { return id !== destinationItem.getId(); }).join(',') || undefined);
    },
    isAssignedTo: function(destinationItem) {
        return (this.node.getAttr('answer') || '').indexOf(destinationItem.getId()) !== -1;
    },
    getMyTargetId: function() {
        return this.node.parent().getAttr('target');
    },
    contents: function() {
        return this.node.contents();
    }
});

var DestinationItem = function(node, exerciseNode) {
    this.node = node;
    this.exerciseNode = exerciseNode;
};
_.extend(DestinationItem.prototype, {
    getId: function() {
        return this.node.getAttr('id');
    },
    getTargetId: function() {
        return this.node.parent().getAttr('id');
    },
    accepts: function(sourceItem) {
        return sourceItem && sourceItem.getMyTargetId() === this.getTargetId();
    },
    getAssignedSources: function() {
        return this.exerciseNode.object.getSourceItems()
            .filter(function(item) {
                return item.isAssignedTo(this);
            }.bind(this));
    }
});

extension.wlxmlClass['exercise.assign'] = {
    methods: {
        isContextRoot: function(node) {
            return this.object.isList(node.parent()) || this.sameNode(node);
        },
        getSourceItems: function() {
            var list;
            this.contents().some(function(node) {
                if(node.is('list') && node.getAttr('target')) {
                    list = node;
                    return true;
                }
            });
            if(!list) {
                throw new Error('Missing source list');
            }
            return list.contents().map(function(node) {return new SourceItem(node, this);});
        },
        getDestinationItems: function() {
            var list;
            this.contents().some(function(node) {
                if(node.is('list') && node.getAttr('id')) {
                    list = node;
                    return true;
                }
            });
            if(!list) {
                throw new Error('Missing destination list');
            }
            return list.contents().map(function(node) {return new DestinationItem(node, this);}.bind(this));
        },
        getDescription: function() {
            var toret = [];
            this.contents().some(function(node) {
                if(this.isList(node)) {
                   return true;
                }
                toret.push(node);
            }.bind(this.object));
            return toret;
        },
        isList: function(node) {
            return this.sameNode(node.parent()) && node.is('list') && (node.getAttr('target') || node.getAttr('id'));
        },
        isItemNode: function(node, parent) {
            return node && this.object.isList(node.parent() || parent);
        }
    }
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