define(function(require) {
    
'use strict';

var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    documentElement = require('modules/documentCanvas/canvas/documentElement'),
    template = require('libs/text!./element.html');


var choiceBase = Object.create(documentElement.DocumentNodeElement.prototype);
_.extend(choiceBase, {
    init: function() {
        documentElement.DocumentNodeElement.prototype.init.call(this);
        this.view = $(_.template(template)({type: this.type}));
        this._container().append(this.view);

        this.createContainer(this.wlxmlNode.contents().filter(function(n) {return !n.is('list');}), {
            manages: function(node, removedFrom) {
                if(node.is('list.orderable')) {
                    return false;
                }
                return this.wlxmlNode.sameNode(node.parent() || removedFrom);
            }.bind(this),
            dom: this.view.find('.description')
        });

        this.wlxmlNode.contents()
            .filter(function(node) { return node.is('list'); })
            .some(function(node) {
                this.listView = this.createListView(node);
                this.view.find('.list').append(this.listView.dom);
            }.bind(this));
    },
    getVerticallyFirstTextElement: function() {
        var toret;
        this.containers.some(function(container) {
            toret = container.getVerticallyFirstTextElement();
            return !!toret;
        });
        return toret;
    },
    onNodeAdded: function(event) {
        var node = event.meta.node;
        if(this.listView.listNode.sameNode(node.parent()) && node.is('item.answer')) {
            this.listView.addItem(node);
        }
    },
    onNodeDetached: function(event) {
        var node = event.meta.node;
        if(this.listView.listNode.sameNode(event.meta.parent) && node.is('item.answer')) {
            this.listView.removeItem(node);
        }
    }
});

return choiceBase;

});


