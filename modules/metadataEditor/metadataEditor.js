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
            var view = this;
            var metaTable = this.metaTable = this.node.find('table');
            
            this.node.find('.rng-module-metadataEditor-addBtn').click(function() {
                var newRow = view._addMetaRow('', '');
                $(newRow.find('td div')[0]).focus();
                sandbox.publish('metadataChanged', view.getMetadata());
            });
            
            this.metaTable.on('click', '.rng-visualEditor-metaRemoveBtn', function(e) {
                $(e.target).closest('tr').remove();
                sandbox.publish('metadataChanged', view.getMetadata());
            });
            
            this.metaTable.on('keydown', '[contenteditable]', function(e) {
                console.log(e.which);
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
                if(e.which !== 13)
                    sandbox.publish('metadataChanged', view.getMetadata());
            };
            this.metaTable.on('keyup', '[contenteditable]', _.throttle(onKeyUp, 500));
        },
        getMetadata: function() {
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
    };
    
    view.setup();
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        setDocument: function(xml) {
            view.setMetadata(transformations.getMetadata(xml));
            sandbox.publish('metadataSet');
        },
        getMetadata: function() {
            return transformations.getXML(view.getMetadata());
        },
        getView: function() {
            return view.node;
        },
        attachMetadata: function(document) {
            var toret = $('<div>');
            toret.append($(document));
            var meta = $('<metadata></metadata>\n').append(transformations.getXML(view.getMetadata()));
            
            var metadata = toret.find('metadata');
            if(metadata.length === 0) {
                var section = toret.find('section');
                section = section.length ? $(section[0]) : null;
                if(section) {
                    section.prepend(meta);
                }
            } else {
                metadata.replaceWith(meta);
            }
            return toret.html();
        }
        
    };
};

});