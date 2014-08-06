define(function(require) {
    
'use strict';

/* globals gettext */

var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    choiceBase = require('./choiceBase'),
    ListView = require('./list');


var choiceMulti = Object.create(choiceBase);
_.extend(choiceMulti, {
    type: 'multi',
    name: gettext('Multiple Choice'),
    createListView: function(listNode) {
        return new ListView(this, listNode, {
            onItemViewAdded: function(itemView) {
                var checkbox = new CheckboxView(itemView.node.getAttr('answer') === 'true', function(checked) {
                    itemView.node.document.transaction(function() {
                        itemView.node.getParent('exercise.choice').object.setAnswer(itemView.node, checked);
                    }, {
                        metadata: {
                            description: gettext('Change answer')
                        }
                    });
                });
                itemView.addPrefixView(checkbox);
            }
        });
    },
    onNodeAttrChange: function(event) {
        if(this.listView.listNode.sameNode(event.meta.node.parent())) {
            this.listView.getItemView(event.meta.node).prefixView.dom.attr('checked', event.meta.newVal === 'true');
        }
    }
});

var CheckboxView = function(checked, onValueChange) {
    this.dom = $('<input type="checkbox">')
            .attr('checked', checked);
    this.dom.on('click', function() {
        onValueChange(this.checked);
    });
};

return choiceMulti;

});