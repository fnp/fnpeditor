define(function(require) {
    
'use strict';
var $ = require('libs/jquery');

var _ = require('libs/underscore'),
    Backbone = require('libs/backbone'),
    viewTemplate = require('libs/text!./view.html'),
    viewItemTemplate = require('libs/text!./viewItem.html');


var OrderExerciseView = function(element) {
    this.element = element;
    this.dom = $(_.template(viewTemplate)());
    this.modePills = this.dom.find('.modePills');
    this.list = this.dom.find('ol');
    this.addButton = this.dom.find('button.add');
    this.description = this.dom.find('.description');
    this.itemViews = [];

    this.addButton.on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        this.trigger('newItemRequested');
        //_.last(this.itemViews).editStart();
    }.bind(this));

    this.modePills.find('a').on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        this.setMode($(e.target).parent().attr('mode'));
    }.bind(this));

    this.mode = 'initial';

    var dropTargets = this.dom.find('.placeholder-top');

    dropTargets.on('dragend', function() {
        dropTargets.removeClass('dragged');
    });

    dropTargets.on('dragenter', function() {
        var first = this.itemViews[0];
        if(this.mode === 'correct') {
            first = this.itemViews.slice(0)
                .sort(function(view1, view2) {
                    if(view1.item.getAnswer() > view2.item.getAnswer()) {
                        return 1;
                    }
                    return -1;
                })[0];
        }
        if(!this.allowDropAt(first, true)) {
            return;
        }
        dropTargets.addClass('active');
    }.bind(this));

    dropTargets.on('dragleave', function() {
        dropTargets.removeClass('active');
    }.bind(this));

    dropTargets.on('dragover', function(e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'move';
    });

    dropTargets.on('drop', function(e) {
        var vid = e.originalEvent.dataTransfer.getData('text');
        var droppedItem = $('[vid='+vid+']').data('viewInstance');

        var first = this.itemViews[0];
        if(this.mode === 'correct') {
            first = this.itemViews.slice(0)
                .sort(function(view1, view2) {
                    if(view1.item.getAnswer() > view2.item.getAnswer()) {
                        return 1;
                    }
                    return -1;
                })[0];
        }

        this.trigger(this.mode === 'initial' ? 'moveItem' : 'moveAnswer', droppedItem.item, first.item, 'before');
        dropTargets.removeClass('active');
    }.bind(this));
};
_.extend(OrderExerciseView.prototype, Backbone.Events, {
    addItem: function(item) {
        var view = new ItemView(item, this);
        view.on('edit', function(text) {
            this.trigger('itemEdited', item, text);
        }.bind(this));
        view.on('receivedDrop', function(droppedItem) {
            this.trigger(this.mode === 'initial' ? 'moveItem' : 'moveAnswer', droppedItem.item, item, 'after');
        }.bind(this));
        view.on('dragStarted', function(view) {
            this.draggedView = view;
        }.bind(this));
        this.list.append(view.dom);
        this.itemViews.push(view);

        if(this.mode === 'correct') {
            this.setMode(this.mode);
        }
    },
    clearItems: function() {
        this.list.empty();
        this.itemViews.forEach(function(view) {
            view.remove();
        });
        this.itemViews = [];
    },
    setMode: function(mode) {
        this.modePills.find('li').removeClass('active');
        this.modePills.find('[mode='+mode+']').addClass('active');
        this.mode = mode;
        this.list.children().detach();

        if(this.mode === 'initial') {
            this.itemViews.forEach(function(itemView) {
                this.list.append(itemView.dom);
            }.bind(this));
        } else {
            this.itemViews.slice(0)
                .sort(function(view1, view2) {
                    if(view1.item.getAnswer() > view2.item.getAnswer()) {
                        return 1;
                    }
                    return -1;
                })
                .forEach(function(itemView) {
                    this.list.append(itemView.dom);
                }.bind(this));
        }
    },
    allowDropAt: function(view, up) {
        var arr = [this.draggedView.dom[0]];
        if(!up) {
            arr.push(this.draggedView.dom.prev()[0]);
        }
        return !_.contains(arr, view.dom[0]);
    }
});

var ItemView = function(item, exerciseView) {
    this.item = item;
    this.exerciseView = exerciseView;
    this.dom = $(_.template(viewItemTemplate)());
    this.content = this.dom.find('.content');


    var dropTargets = this.dom.find('.placeholder'),
        dragSources = this.dom.find('.wrapper');

    dragSources.on('dragstart', function(e) {
        this.dom.addClass('dragged');
        e.originalEvent.dataTransfer.setData('text', this.dom.attr('vid'));
        e.originalEvent.effectAllowed = 'move';
        this.trigger('dragStarted', this);

    }.bind(this));

    dropTargets.on('dragend', function() {
        this.dom.removeClass('dragged');
    });

    dropTargets.on('dragenter', function() {
        if(!this.exerciseView.allowDropAt(this)) {
            return;
        }
        dropTargets.addClass('active');
    }.bind(this));

    dropTargets.on('dragleave', function() {
        dropTargets.removeClass('active');
    }.bind(this));

    dropTargets.on('dragover', function(e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'move';
    });

    dropTargets.on('drop', function(e) {
        var vid = e.originalEvent.dataTransfer.getData('text');
        var droppedItem = $('[vid='+vid+']').data('viewInstance');
        e.preventDefault();
        this.trigger('receivedDrop', droppedItem);
    }.bind(this));

    var content = this.content;
    this.container = exerciseView.element.createContainer(item.node.contents(), {
        resetBackground: true,
        manages: function(node, originaParent) {
            return item.node.sameNode(node.parent() || originaParent);
        },
        dom: content
    });

    this.dom.data('viewInstance', this);
    this.dom.attr('vid', _.uniqueId());
};

_.extend(ItemView.prototype, Backbone.Events, {
    remove: function() {
        this.container.remove();
    }
});

return OrderExerciseView;

});


