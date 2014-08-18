define(function(require) {
    
'use strict';
var $ = require('libs/jquery');

var _ = require('libs/underscore'),
    Backbone = require('libs/backbone'),
    viewTemplate = require('libs/text!./view.html'),
    sourceItemTemplate = require('libs/text!./sourceItem.html'),
    destinationItemTemplate = require('libs/text!./destinationItem.html');


var AssignExerciseView = function(element) {
    this.element = element;
    this.dom = $(_.template(viewTemplate)());
    this.modePills = this.dom.find('.modePills');
    this.sources = this.dom.find('.sources');
    this.destinations = this.dom.find('.destinations');
    this.description = this.dom.find('.description');
    this.sourceItemViews = [];
    this.destinationItemViews = [];
};

_.extend(AssignExerciseView.prototype, Backbone.Events, {
    addSourceItem: function(item) {
        var view = new SourceItemView(item, this);
        this.sources.append(view.dom);
        this.sourceItemViews.push(view);
    },
    addDestinationItem: function(item) {
        var view = new DestinationItemView(item, this);
        view.on('receivedDrop', function(sourceItem, destinationItem) {
            //this.trigger(this.mode === 'initial' ? 'moveItem' : 'moveAnswer', droppedItem.item, item, 'after');
            sourceItem.assignTo(destinationItem);
        }.bind(this));
        this.destinations.append(view.dom);
        this.destinationItemViews.push(view);
    },
    clearItems: function() {
        this.sources.empty();
        this.destinations.empty();
        this.sourceItemViews.concat(this.destinationItemViews).forEach(function(view) {
            view.remove();
        });
        this.sourceItemViews = [];
        this.destinationItemViews = [];
    }
});

var SourceItemView = function(item, exerciseView) {
    this.item = item;
    this.exerciseView = exerciseView;
    this.dom = $(_.template(sourceItemTemplate)());


    var dragSources = this.dom.find('.handle');

    dragSources.on('dragstart', function(e) {
        e.originalEvent.dataTransfer.setData('text', this.dom.attr('sourceItemId'));
        e.originalEvent.effectAllowed = 'move';

    }.bind(this));

    this.container = exerciseView.element.createContainer(item.node.contents(), {
        resetBackground: true,
        manages: function(node, originaParent) {
            return item.node.sameNode(node.parent() || originaParent);
        },
        dom: this.dom
    });

    this.dom.data('item', this.item);
    this.dom.attr('itemDOMID', _.uniqueId());
};

_.extend(SourceItemView.prototype, Backbone.Events, {
    remove: function() {
        this.container.remove();
    }
});

var DestinationItemView = function(item, exerciseView) {
    this.item = item;
    this.exerciseView = exerciseView;
    this.dom = $(_.template(destinationItemTemplate)());

    this.dom.on('dragover', function(e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'move';
    });

    this.dom.on('drop', function(e) {
        var DOMID = e.originalEvent.dataTransfer.getData('text'),
            sourceItem = $('[DOMID='+DOMID+']').data('item');
        e.preventDefault();
        this.trigger('receivedDrop', sourceItem, this.item);
    }.bind(this));

    this.container = exerciseView.element.createContainer(item.node.contents(), {
        resetBackground: true,
        manages: function(node, originaParent) {
            return item.node.sameNode(node.parent() || originaParent);
        },
        dom: this.dom.find('.content')
    });

    this.containers = [];

    this.item.getAssignedSources().forEach(function(sourceItem) {
        var wrapper = $('<div class="wrapper"></div>');
        var container = exerciseView.element.createContainer(sourceItem.contents(), {
            resetBackground: true,
            manages: function(node, originaParent) {
                return sourceItem.node.sameNode(node.parent() || originaParent);
            },
            dom: wrapper,
            mirrors: true
        });
        this.containers.push(container);

        this.dom.find('.assignments').append(container.dom);
    }.bind(this));
};
_.extend(DestinationItemView.prototype, Backbone.Events, {
    remove: function() {
        this.container.remove();
        this.containers.forEach(function(container) {
            container.remove();
        });
    }
});

return AssignExerciseView;

});
