define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'./transformations',
'libs/text!./templates/main.html',
'libs/text!./templates/item.html'
], function($, _, transformations, mainTemplate, itemTemplate) {

'use strict';

return function(sandbox) {

    
    var view = {
        node: $(_.template(mainTemplate)()),
        setup: function() {
            var metaTable = this.metaTable = this.node.find('table');
            
            this.node.find('.rng-module-metadataEditor-addBtn').click(function() {
                var newRow = view._addMetaRow('', '');
                $(newRow.find('td div')[0]).focus();
                //isDirty = true;
            });
            
            this.metaTable.on('click', '.rng-visualEditor-metaRemoveBtn', function(e) {
                $(e.target).closest('tr').remove();
                //isDirty = true;
            });
            
            this.metaTable.on('keydown', '[contenteditable]', function(e) {
                console.log(e.which);
                if(e.which === 13) { 
                    if($(document.activeElement).hasClass('rng-module-metadataEditor-metaItemKey')) {
                        metaTable.find('.rng-module-metadataEditor-metaItemValue').focus();
                    } else {
                        var input = $('<input>');
                        input.appendTo('body').focus()
                        view.node.find('.rng-module-metadataEditor-addBtn').focus();
                        input.remove();
                    }
                    e.preventDefault();
                }
                
            });
        },
        getMetaData: function() {
            var toret = {};
            this.node.find('tr').each(function() {
                var tr = $(this);
                var inputs = $(this).find('td [contenteditable]');
                var key = $(inputs[0]).text();
                var value = $(inputs[1]).text();
                toret[key] = value;
            });
            return toret;
        },
        setMetadata: function(metadata) {
            var view = this;
            this.metaTable.find('tr').remove();
            _.each(_.keys(metadata), function(key) {    
                view._addMetaRow(key, metadata[key]);
            });
        },
        _addMetaRow: function(key, value) {
            var newRow = $(_.template(itemTemplate)({key: key || '', value: value || ''}));
            newRow.appendTo(this.metaTable);
            return newRow;
        }
    }
    
    view.setup();
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        setMetadata: function(xml) {
            view.setMetadata(transformations.getMetadata(xml));
        },
        getMetadata: function() {
            return view.getMetadata();
        },
        getView: function() {
            return view.node;
        }
        
    };
}

});