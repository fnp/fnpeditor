define(function(require) {
    
'use strict';

/* globals gettext */

var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    choiceBase = require('./choiceBase'),
    ListView = require('./list');


var choiceSingle = Object.create(choiceBase);
_.extend(choiceSingle, {
    type: 'single',
    name: gettext('Single Choice'),
    init: function() {
        this._comboName = _.uniqueId('edumed_exercise_hash_');
        choiceBase.init.call(this);
    },
    createListView: function(listNode) {
        var el = this;
        return new ListView(this, listNode, {
            onItemViewAdded: function(itemView) {
                var radiobox = new RadioView(itemView.node.getAttr('answer') === 'true', el._comboName, function() {
                    itemView.node.document.transaction(function() {
                        itemView.node.getParent('exercise.choice').object.markAsAnswer(itemView.node);
                    }, {
                        metadata: {
                            description: gettext('Change answer')
                        }
                    });
                    
                });
                itemView.addPrefixView(radiobox);
            }
        });
    },
    onNodeAttrChange: function(event) {
        if(this.listView.listNode.sameNode(event.meta.node.parent())) {
            this.listView.getItemView(event.meta.node).prefixView.dom.attr('checked', event.meta.newVal === 'true');
        }
    }
});

var RadioView = function(checked, name, onValueChange) {
    this.dom = $('<input type="radio">')
            .attr('checked', checked)
            .attr('name', name);
    this.dom.on('change', function() {
        onValueChange(this.checked);
    });
};

return choiceSingle;

});