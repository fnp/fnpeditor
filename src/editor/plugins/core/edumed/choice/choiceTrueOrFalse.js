define(function(require) {
    
'use strict';

/* globals gettext */

var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    choiceBase = require('./choiceBase'),
    switchTemplate = require('libs/text!./trueOrFalseSwitch.html'),
    ListView = require('./list');


var trueOrFalse  = Object.create(choiceBase);
_.extend(trueOrFalse, {
    type: 'true-or-false',
    name: gettext('True or False'),
    createListView: function(listNode) {
        return new ListView(this, listNode, {
            onItemViewAdded: function(itemView) {
                var switchView = new Switch(itemView.node.getAttr('answer') === 'true', function(choice) {
                    itemView.node.document.transaction(function() {
                        itemView.node.getParent('exercise.choice').object.setAnswer(itemView.node, choice);
                    }, {
                        metadata: {
                            description: gettext('Change answer')
                        }
                    });
                });
                itemView.addPrefixView(switchView);
            }
        });
    }
});

var Switch = function(checked, onValueChange) {
    this.dom = $(_.template(switchTemplate)());
    var trueBtn = this.dom.find('.true'),
        falseBtn = this.dom.find('.false');

    trueBtn.on('click', function() {
        trueBtn.addClass('selected');
        falseBtn.removeClass('selected');
        onValueChange(true);
    });
    this.dom.find('.false').on('click', function() {
        falseBtn.addClass('selected');
        trueBtn.removeClass('selected');
        onValueChange(false);
    });
    trueBtn.toggleClass('selected', checked);
    falseBtn.toggleClass('selected', !checked);
};

return trueOrFalse;

});