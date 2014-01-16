define([
'libs/jquery',
'libs/underscore',
'libs/text!./templates/main.html',
'libs/text!./templates/item.html'
], function($, _, mainTemplate, itemTemplate) {

'use strict';

return function(sandbox) {

    var currentNode;
    
    var view = {
        node: $(_.template(mainTemplate)()),
        setup: function() {
            var view = this;
            var metaTable = this.metaTable = this.node.find('table');
            
            this.node.find('.rng-module-metadataEditor-addBtn').click(function() {
                var newRow = view._addMetaRow('', '');
                $(newRow.find('td div')[0]).focus();
            });
            
            this.metaTable.on('click', '.rng-visualEditor-metaRemoveBtn', function(e) {
                $(e.target).closest('tr').remove();
            });
            
            this.metaTable.on('keydown', '[contenteditable]', function(e) {
                /* globals document */
                if(e.which === 13) {
                    if($(document.activeElement).hasClass('rng-module-metadataEditor-metaItemKey')) {
                        metaTable.find('.rng-module-metadataEditor-metaItemValue').focus();
                    } else {
                        var input = $('<input>');
                        input.appendTo('body').focus();
                        view.node.find('.rng-module-metadataEditor-addBtn').focus();
                        input.remove();
                    }
                    e.preventDefault();
                }
            });
            
            
            var onKeyUp = function(e) {
                if(e.which !== 13) {
                    var editable = $(e.target),
                        myIndex = metaTable.find('.'+editable.attr('class')).index(editable),
                        isKey = _.last(editable.attr('class').split('-')) === 'metaItemKey',
                        toSet = {};
                    toSet[isKey ? 'key' : 'value'] = editable.text();
                    currentNode.setMetadataRow(myIndex, toSet);
                }
            };
            this.metaTable.on('keyup', '[contenteditable]', _.throttle(onKeyUp, 500));
        },
        setMetadata: function(node) {
            var view = this,
                metadata = node.getMetadata();
            this.metaTable.find('tr').remove();
            metadata.forEach(function(row) {
                view._addMetaRow(row.getKey(), row.getValue());
            });
        },
        _addMetaRow: function(key, value) {
            var newRow = $(_.template(itemTemplate)({key: key || '', value: value || ''}));
            newRow.appendTo(this.metaTable);
            return newRow;
        }
    };
    
    view.setup();
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        setDocument: function(document) {
            document.on('change', function(event) {
                if(event.type === 'nodeMetadataChange' && event.meta.node.sameNode(currentNode)) {
                    view.setMetadata(currentNode);
                }
            });
        },
        setNodeElement: function(node) {
            if(currentNode && currentNode.sameNode(node)) {
                return
            }
            currentNode = node;
            view.setMetadata(node);
        },
        getView: function() {
            return view.node;
        }
    };
};

});