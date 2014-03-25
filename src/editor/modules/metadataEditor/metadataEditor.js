define([
'libs/jquery',
'libs/underscore',
'libs/text!./templates/main.html',
'libs/text!./templates/item.html',
'views/openSelect/openSelect'
], function($, _, mainTemplate, itemTemplate, OpenSelectView) {

'use strict';

return function(sandbox) {

    var currentNode,
        adding = false,
        metadataConfig = (sandbox.getConfig().metadata || []).sort(function(configRow1, configRow2) {
            if(configRow1.key < configRow2.key) {
                return -1;
            }
            if(configRow1.key > configRow2.key) {
                return 1;
            }
            return 0;
        });

    var getValuesForKey = function(key) {
        var toret = [];
        metadataConfig.some(function(configRow) {
            if(configRow.key === key) {
                toret = configRow.values || [];
                return true;
            }
        });
        return toret;
    };
    
    var view = {
        node: $(_.template(mainTemplate)()),
        setup: function() {
            var view = this;
            var metaTable = this.metaTable = this.node.find('table');
            
            this.node.find('.rng-module-metadataEditor-addBtn').click(function() {
                adding = true;
                currentNode.getMetadata().add('','');
            });
            
            this.metaTable.on('click', '.rng-visualEditor-metaRemoveBtn', function(e) {
                $(e.target).closest('tr').data('row').remove();
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
            
            this.metaTable.on('keyup', '[contenteditable]', _.throttle(function(e) {
                if(e.which !== 13) {
                    var editable = $(e.target),
                        toSet = editable.text(),
                        row = editable.parents('tr').data('row'),
                        isKey = _.last(editable.attr('class').split('-')) === 'metaItemKey',
                        method = isKey ? 'setKey' : 'setValue';
                    row[method](toSet);
                }
            }, 500));
        },
        clear: function() {
        },
        setMetadata: function(node) {
            if(!node) {
                this.metaTable.html('');
                return;
            }
            var view = this,
                metadata = node.getMetadata();
            this.metaTable.find('tr').remove();
            metadata.forEach(function(row) {
                view.addMetadataRow(row);
            });
        },
        addMetadataRow: function(row) {
            var newRow = $(_.template(itemTemplate)({key: row.getKey() || '', value: row.getValue() || ''}));
            newRow.appendTo(this.metaTable);
            newRow.data('row', row);

            var keySelectView = new OpenSelectView({
                value: row.getKey() || '',
                inputTemplate: _.template('<div class="openInput rng-module-metadataEditor-metaItemKey" contentEditable="true"><%= value %></div>')({value: row.getKey() || '' }),
                setInput: function(inputDOM, value) {
                    if(inputDOM.text() !== value) {
                        inputDOM.text(value);
                        row.setKey(value);
                    }
                    valueSelectView.clearItems();
                    getValuesForKey(value).forEach(function(value) {
                        valueSelectView.addItem(value);
                    });
                }
            });
            newRow.find('td:first').append(keySelectView.el).data('view', keySelectView);


            var valueSelectView = new OpenSelectView({
                value: row.getValue(),
                inputTemplate: _.template('<div class="openInput rng-module-metadataEditor-metaItemValue" contentEditable="true"><%= value %></div>')({value: row.getValue() || '' }),
                setInput: function(inputDOM, value) {
                    if(inputDOM.text() !== value) {
                        inputDOM.text(value);
                        row.setValue(value);
                    }
                }
            });
            newRow.find('td:nth-child(2)').append(valueSelectView.el).data('view', valueSelectView);
            

            metadataConfig.forEach(function(configRow) {
                keySelectView.addItem(configRow.key);
                if(row.getKey() === configRow.key) {
                    (configRow.values || []).forEach(function(value) {
                        valueSelectView.addItem(value);
                    });
                }
            });

            if(adding) {
                $(newRow.find('td div')[0]).focus();
                adding = false;
            }
            return newRow;
        },
        updateMetadataRow: function(row) {
            this._getRowTr(row, function(tr) {
                var tds = tr.find('td'),
                    keyTd = $(tds[0]),
                    valueTd = $(tds[1]);

                keyTd.data('view').setInput(row.getKey());
                valueTd.data('view').setInput(row.getValue());
            });
        },
        removeMetadataRow: function(row) {
            this._getRowTr(row, function(tr) {
                tr.remove();
            });
        },
        _getRowTr: function(row, callback) {
            this.metaTable.find('tr').each(function() {
                var tr = $(this);
                if(tr.data('row') === row) {
                    callback(tr);
                    return false;
                }
            });
        }
    };
    
    view.setup();
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        setDocument: function(document) {
            document.on('change', function(event) {
                if(event.type === 'metadataAdded' && event.meta.node.sameNode(currentNode)) {
                    view.addMetadataRow(event.meta.row);
                }
                if(event.type === 'metadataChanged' && event.meta.node.sameNode(currentNode)) {
                    view.updateMetadataRow(event.meta.row);
                }
                if(event.type === 'metadataRemoved' && event.meta.node.sameNode(currentNode)) {
                    view.removeMetadataRow(event.meta.row);
                }
                if(event.type === 'nodeDetached' && event.meta.node.sameNode(currentNode)) {
                    view.setMetadata(null);
                }
            });
        },
        setNodeElement: function(node) {
            if(currentNode && currentNode.sameNode(node)) {
                return;
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