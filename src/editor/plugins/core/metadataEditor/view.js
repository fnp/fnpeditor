define([
'libs/jquery',
'libs/underscore',
'libs/text!./templates/main.html',
'libs/text!./templates/item.html',
'views/openSelect/openSelect',
'views/attachments/attachments'
], function($, _, mainTemplate, itemTemplate, OpenSelectView, attachments) {

'use strict';
/* globals gettext */


var View = function(node, metadataConfig) {
    this.node = node;
    this.metadataConfig = metadataConfig;
    this.dom = $(_.template(mainTemplate)());
    this.adding = false;

    var metaTable = this.metaTable = this.dom.find('table');
    
    this.dom.find('.rng-module-metadataEditor-addBtn').click(function() {
        this.adding = true;
        this.node.document.transaction(function() {
            this.node.getMetadata().add('','');
        }.bind(this), {
            metadata: {
                description: gettext('Add metadata row')
            }
        });
    }.bind(this));
    
    this.metaTable.on('click', '.rng-visualEditor-metaRemoveBtn', function(e) {
        this.node.document.transaction(function() {
            $(e.target).closest('tr').data('row').remove();
        }, {
            metadata: {
                description: gettext('Remove metadata row')
            }
        });
    }.bind(this));
    
    this.metaTable.on('keydown', '[contenteditable]', function(e) {
        /* globals document */
        if(e.which === 13) {
            if($(document.activeElement).hasClass('rng-module-metadataEditor-metaItemKey')) {
                metaTable.find('.rng-module-metadataEditor-metaItemValue').focus();
            } else {
                var input = $('<input>');
                input.appendTo('body').focus();
                this.dom.find('.rng-module-metadataEditor-addBtn').focus();
                input.remove();
            }
            e.preventDefault();
        }
    }.bind(this));

    this.metaTable.on('keyup', '[contenteditable]', _.throttle(function(e) {
        if(e.which !== 13) {
            var editable = $(e.target),
                toSet = editable.text(),
                row = editable.parents('tr').data('row'),
                isKey = _.last(editable.attr('class').split('-')) === 'metaItemKey',
                method = isKey ? 'setKey' : 'setValue';
            row.metadata.node.document.transaction(function() {
                row[method](toSet);
            }, {
                metadata: {
                    description: gettext('Metadata edit')
                }
            });
        }
    }, 500));

    this.setMetadata(this.node); //

    this.node.document.on('change', this.handleEvent, this);
};

_.extend(View.prototype, {
    close: function() {
        this.node.document.off('change', this.handleEvent);
    },
    handleEvent: function(event) {
        if(event.type === 'metadataAdded' && event.meta.node.sameNode(this.node)) {
            this.addMetadataRow(event.meta.row);
        }
        if(event.type === 'metadataChanged' && event.meta.node.sameNode(this.node)) {
            this.updateMetadataRow(event.meta.row);
        }
        if(event.type === 'metadataRemoved' && event.meta.node.sameNode(this.node)) {
            this.removeMetadataRow(event.meta.row);
        }
        if(event.type === 'nodeDetached' && event.meta.node.containsNode(this.node)) {
            this.setMetadata(null);
        }
    },
    getValuesForKey: function(key) {
        var toret = [];
        this.metadataConfig.some(function(configRow) {
            if(configRow.key === key) {
                toret = configRow.values || [];
                return true;
            }
        });
        return toret;
    },
    getIsFileForKey: function(key) {
        var toret = false;
        this.metadataConfig.some(function(configRow) {
            if (configRow.key == key) {
                toret = configRow.isFile || false;
                return true
            }
        });
        return toret;
    },
    setMetadata: function(node) {
        this.dom.find('.rng-module-metadataEditor-addBtn').attr('disabled', !node);
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
        console.log(row);
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
                this.getValuesForKey(value).forEach(function(value) {
                    valueSelectView.addItem(value);
                });
                
            }.bind(this)
        });
        newRow.find('td:first').append(keySelectView.el).data('view', keySelectView);


        var valueSelectView = new OpenSelectView({
            value: row.getValue(),
            inputTemplate: _.template('<div class="openInput rng-module-metadataEditor-metaItemValue" contentEditable="true"><%= value %></div>')({value: row.getValue() || '' }),
            maxHeight: '300px',
            maxWidth: '100px',
            setInput: function(inputDOM, value) {
                if(inputDOM.text() !== value) {
                    inputDOM.text(value);
                    row.setValue(value);
                }
            }
        });
        newRow.find('td:nth-child(2)').append(valueSelectView.el).data('view', valueSelectView);

        if (this.getIsFileForKey(row.getKey())) {
            var el = $("<a href='#-' class='attachment-library' style='float: right'>" + gettext('attachments') + "</a>");
            el.on('click', function() {
                attachments.select(function(v) {
                    valueSelectView.setInput(v);
                });
                return false;
            });
            newRow.find('td:nth-child(2)').append(el);
        }


        this.metadataConfig.forEach(function(configRow) {
            keySelectView.addItem(configRow.key);
            if(row.getKey() === configRow.key) {
                (configRow.values || []).forEach(function(value) {
                    valueSelectView.addItem(value);
                });
            }
        });

        if(this.adding) {
            $(newRow.find('td div')[0]).focus();
            this.adding = false;
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
});


return View;


});