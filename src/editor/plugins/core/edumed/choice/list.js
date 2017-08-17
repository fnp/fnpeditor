define(function(require) {
    
'use strict';
var $ = require('libs/jquery');

var _ = require('libs/underscore'),
    Backbone = require('libs/backbone'),
    viewTemplate = require('libs/text!./list.html'),
    viewItemTemplate = require('libs/text!./listItem.html');


var ListView = function(element, listNode, params) {
    this.element = element;
    this.listNode = listNode;
    this.params = params;
    this.dom = $(_.template(viewTemplate)());
    this.list = this.dom.find('ul');
    this.itemViews = [];

    this.listNode.contents()
        .filter(function(node) {
            return node.is('item.answer');
        })
        .forEach(function(node) {
            this.addItem(node);
        }.bind(this));
};
_.extend(ListView.prototype, Backbone.Events, {
    addItem: function(node) {
        var view = new ItemView(node, this);
        var idx = this.listNode.contents()
            .filter(function(n) { return n.is('item'); })
            .indexOf(node);

        if(idx <= this.itemViews.length - 1) {
                this.itemViews.splice(idx, 0, view);
        } else {
            this.itemViews.push(view);
        }
        if(idx > 0) {
            this.itemViews[idx-1].dom.after(view.dom);
        } else {
            this.list.prepend(view.dom);
        }
        if(this.params.onItemViewAdded) {
            this.params.onItemViewAdded(view);
        }
    },
    removeItem: function(node) {
        this.itemViews.some(function(view, idx) {
            if(view.node.sameNode(node)) {
                view.remove();
                this.itemViews.splice(idx, 1);
                return true;
            }
        }.bind(this));
    },
    getItemView: function(node) {
        var toret;
        this.itemViews.some(function(view) {
            if(view.node.sameNode(node)) {
                toret = view;
                return true;
            }
        }.bind(this));
        return toret;
    }
});

var ItemView = function(node, exerciseView) {
    this.node = node;
    this.exerciseView = exerciseView;
    this.dom = $(_.template(viewItemTemplate)());

    this.container = exerciseView.element.createContainer(node.contents(), {
        resetBackground: true,
        manages: function(node, originalParent) {
            return this.node.sameNode(node.parent() || originalParent);
        }.bind(this),
        dom: this.dom.find('.content')
    });
};

_.extend(ItemView.prototype, Backbone.Events, {
    remove: function() {
        this.container.remove();
        this.dom.remove();
    },
    addPrefixView: function(view) {
        this.dom.find('.prefix').append(view.dom);
        this.prefixView = view;
    }
});

return ListView;

});
