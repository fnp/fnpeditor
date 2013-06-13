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
        
    var addHistoryItem = function(item, options) {
        historyItems.add(item);
        var view = new itemView(item);
        itemViews.push(view);
        domNodes.itemList.prepend(view.dom);
        if(options.animate) {
            view.dom.hide().slideDown();
        }
    }
    
    var toggleItemViews = function(toggle) {
        itemViews.forEach(function(view) {
            if(!historyItems.selected(view.item))
                view.toggle(toggle);
        });
    }
    
    var toggleButton = function(btn, toggle) {
        dom.find('button.'+btn).toggleClass('disabled', !toggle);
    }
    
    var historyItems = {
        _itemsById: {},
        _selected: [],
        select: function(item) {
            if(this._selected.length < 2) {
                this._selected.push(item.version);
                this._updateUI();
                return true;
            }
            return false;
        },
        unselect: function(item) {
            this._selected = _.without(this._selected, item.version);
            this._updateUI();
        },
        add: function(item) {
            this._itemsById[item.version] = item;
        },
        selected: function(item) {
            return _.contains(this._selected, item.version);
        },
        _updateUI: function() {
            var len = this._selected.length;
            if(len === 0) {
                toggleButton('compare', false);
                toggleButton('show2', false);
                toggleButton('restore', false);
            }
            if(len === 1) {
                toggleButton('compare', false);
                toggleButton('show2', true);
                toggleButton('restore', true);
            }
            if(len === 2) {
                toggleItemViews(false);
                toggleButton('compare', true);
                toggleButton('show2', false);
                toggleButton('restore', false);
            } else {
                toggleItemViews(true);
            }
        }
    };
    historyItems._updateUI();
    
    var itemView = function(item) {
        this.item = item;
        this.dom = $(this.template(item));
        this.dom.on('click', _.bind(this.onItemClicked, this));
    };
    itemView.prototype.template = _.template(itemTemplateSrc);
    itemView.prototype.onItemClicked = function() {
        if(historyItems.selected(this.item)) {
            historyItems.unselect(this.item);
            this.dimItem();
        } else if(historyItems.select(this.item)) {
            this.highlightItem();
        }            
    };
    itemView.prototype.highlightItem = function() {
        this.dom.addClass('highlighted');
    };
    itemView.prototype.dimItem = function() {
        this.dom.removeClass('highlighted');
    };
    itemView.prototype.toggle = function(toggle) {
        this.dom.toggleClass('disabled', !toggle);
    };

    
    
    return {
        start: function() { sandbox.publish('ready'); },
        addHistory: function(history, options) {
            history.forEach(function(historyItem) {
                addHistoryItem(historyItem, options || {});
            });
        },
        getView: function() {
            return dom;
        }
    }
}

});