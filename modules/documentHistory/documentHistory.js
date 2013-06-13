define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'libs/text!./templates/main.html',
'libs/text!./templates/item.html'
], function($, _, mainTemplateSrc, itemTemplateSrc) {

'use strict';
    
return function(sandbox) {
    
    var dom = $(_.template(mainTemplateSrc)());
    var domNodes = {
        itemList: dom.find('.rng-module-documentHistory-itemsList'),
    }
    var itemViews = [];
        
    var addHistoryItem = function(item) {
        historyItems.add(item);
        var view = new itemView(item);
        itemViews.push(view);
        domNodes.itemList.append(view.dom);
    }
    
    var toggleItemViews = function(toggle) {
        itemViews.forEach(function(view) {
            view.toggle(toggle);
        });
    }
    
    var historyItems = {
        _itemsById: {},
        _selected: [],
        select: function(id) {
            if(this._selected.length < 2) {
                this._selected.push(id);
                if(this._selected.length === 2)
                    toggleItemViews(false);
                return true;
            }
            return false;
        },
        unselect: function(item) {
            this._selected = _.without(this._selected, id);
            if(this._selected.length < 2)
                toggleItemViews(true);
        },
        add: function(item) {
            this._itemsById[item.id] = item;
        },
        selected: function(item) {
            return _.contains(_selected, item.id);
        }
    };
    
    var itemView = function(item) {
        this.item = item;
        this.dom = $(this.template(item));
        this.dom.on('click', this.onItemClicked);
    };
    itemView.prototype.template = _.template(itemTemplateSrc);
    itemView.prototype.onItemClicked = function() {
        if(historyItems.selected(item)) {
            historyItems.unselect(item);
            this.dimItem();
        } else if(historyItems.select(item)) {
            this.highlightItem();
        }            
    };
    itemView.prototype.highlightItem = function() {
        
    };
    itemView.prototype.dimItem = function() {
    
    };
    itemView.prototype.toggle = function(toggle) {
    
    };

    
    
    return {
        start: function() { sandbox.publish('ready'); },
        setHistory: function(history) {
            history.forEach(function(historyItem) {
                addHistoryItem(historyItem);
            });
        },
        getView: function() {
            return dom;
        }
    }
}

});