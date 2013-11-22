define([
'libs/jquery',
'libs/underscore',
'./restoreDialog',
'libs/text!./templates/main.html',
'libs/text!./templates/item.html'
], function($, _, restoreDialog, mainTemplateSrc, itemTemplateSrc) {

'use strict';
    
return function(sandbox) {
    
    var dom = $(_.template(mainTemplateSrc)());
    var domNodes = {
        itemList: dom.find('.rng-module-documentHistory-itemsList'),
    };
    var itemViews = [];
    
    
    dom.find('.btn.compare').click(function() {
        var selected = historyItems.getSelected();
        sandbox.publish('compare', selected[0], selected[1]);
    });
    
    dom.find('.btn.restore').click(function() {
        var dialog = restoreDialog.create();
        dialog.on('restore', function(event) {
            sandbox.publish('restoreVersion', {version: historyItems.getSelected()[0], description: event.data.description});
            event.success();
        });
        dialog.show();
    });
    
    dom.find('.btn.display').click(function() {
        sandbox.publish('displayVersion', {version: historyItems.getSelected()[0]});
    });
        
    var addHistoryItem = function(item, options) {
        historyItems.add(item);
        var view = new ItemView(item);
        itemViews.push(view);
        domNodes.itemList.prepend(view.dom);
        if(options.animate) {
            view.dom.hide().slideDown();
        }
    };
    
    var toggleItemViews = function(toggle) {
        itemViews.forEach(function(view) {
            if(!historyItems.isSelected(view.item)) {
                view.toggle(toggle);
            }
        });
    };
    
    var toggleButton = function(btn, toggle) {
        dom.find('button.'+btn).toggleClass('disabled', !toggle);
    };
    
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
        isSelected: function(item) {
            return _.contains(this._selected, item.version);
        },
        getSelected: function() {
            return this._selected;
        },
        _updateUI: function() {
            var len = this._selected.length;
            if(len === 0) {
                toggleButton('compare', false);
                toggleButton('display', false);
                toggleButton('restore', false);
            }
            if(len === 1) {
                toggleButton('compare', false);
                toggleButton('display', true);
                toggleButton('restore', true);
            }
            if(len === 2) {
                toggleItemViews(false);
                toggleButton('compare', true);
                toggleButton('display', false);
                toggleButton('restore', false);
            } else {
                toggleItemViews(true);
            }
        }
    };
    historyItems._updateUI();
    
    var ItemView = function(item) {
        this.item = item;
        this.dom = $(this.template(item));
        this.dom.on('click', _.bind(this.onItemClicked, this));
    };
    ItemView.prototype.template = _.template(itemTemplateSrc);
    ItemView.prototype.onItemClicked = function() {
        if(historyItems.isSelected(this.item)) {
            historyItems.unselect(this.item);
            this.dimItem();
        } else if(historyItems.select(this.item)) {
            this.highlightItem();
        }
    };
    ItemView.prototype.highlightItem = function() {
        this.dom.addClass('highlighted');
    };
    ItemView.prototype.dimItem = function() {
        this.dom.removeClass('highlighted');
    };
    ItemView.prototype.toggle = function(toggle) {
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
    };
};

});