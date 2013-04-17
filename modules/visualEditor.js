rng.modules.visualEditor = function(sandbox) {
    var transformations = rng.modules.visualEditor.transformations;

    var view = {
        node: $(sandbox.getTemplate('main')()),
        setup: function() {
            var view = this;

            this.node.find('#rng-visualEditor-content').on('keyup', function() {
                isDirty = true;
            });
            
            this.node.find('#rng-visualEditor-meta').on('keyup', function() {
                isDirty = true;
            });

            this.node.on('mouseover', '[wlxml-tag]', function(e) { $(e.target).addClass('rng-hover')});
            this.node.on('mouseout', '[wlxml-tag]', function(e) { $(e.target).removeClass('rng-hover')});
            this.node.on('click', '[wlxml-tag]', function(e) {
                console.log('clicked node type: '+e.target.nodeType);
                view._markSelected($(e.target));
            });

            this.node.on('keyup', '#rng-visualEditor-contentWrapper', function(e) {
                var anchor = $(window.getSelection().anchorNode);
                if(anchor[0].nodeType === Node.TEXT_NODE)
                    anchor = anchor.parent();
                if(!anchor.is('[wlxml-tag]'))
                    return;
                view._markSelected(anchor);
            });
            
            
            var metaTable = this.metaTable = this.node.find('#rng-visualEditor-meta table');
            
            this.metaTable.find('.rng-visualEditor-metaAddBtn').click(function() {
                var newRow = view._addMetaRow('', '');
                $(newRow.find('td div')[0]).focus();
                isDirty = true;
            });
            
            this.metaTable.on('click', '.rng-visualEditor-metaRemoveBtn', function(e) {
                $(e.target).closest('tr').remove();
                isDirty = true;
            });
            
            this.metaTable.on('keydown', '[contenteditable]', function(e) {
                console.log(e.which);
                if(e.which === 13) { 
                    if($('*:focus').hasClass('rng-visualEditor-metaItemKey')) {
                        metaTable.find('.rng-visualEditor-metaItemValue').focus();
                    } else {
                        var input = $('<input>');
                        input.appendTo('body').focus()
                        metaTable.find('.rng-visualEditor-metaAddBtn').focus();
                        input.remove();
                    }
                    e.preventDefault();
                }
                
            });

        },
        getMetaData: function() {
            var toret = {};
            this.metaTable.find('tr').not('.rng-visualEditor-addMetaRow').each(function() {
                var tr = $(this);
                var inputs = $(this).find('td [contenteditable]');
                var key = $(inputs[0]).text();
                var value = $(inputs[1]).text();
                toret[key] = value;
            });
            console.log(toret);
            return toret;
        },
        setMetaData: function(metadata) {
            var view = this;
            this.metaTable.find('tr').not('.rng-visualEditor-addMetaRow').remove();
            _.each(_.keys(metadata), function(key) {    
                view._addMetaRow(key, metadata[key]);
            });
        },
        setBody: function(HTMLTree) {
            this.node.find('#rng-visualEditor-content').html(HTMLTree);
        },
        getBody: function() {
            return this.node.find('#rng-visualEditor-content').html();
        }, 
        _markSelected: function(node) {
            this.node.find('.rng-current').removeClass('rng-current');
            node.addClass('rng-current');
        },
        _addMetaRow: function(key, value) {
            var addRow = this.metaTable.find('.rng-visualEditor-addMetaRow');
            var newRow = $(sandbox.getTemplate('metaItem')({key: key || '', value: value || ''}));
            newRow.insertBefore(addRow);
            return newRow;
        }
    };
    view.setup();
    
    var isDirty = false;
    
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        getView: function() {
            return view.node;
        },
        setDocument: function(xml) {
            var transformed = transformations.fromXML.getDocumentDescription(xml);
            view.setBody(transformed.HTMLTree);
            view.setMetaData(transformed.metadata);
            isDirty = false;
        },
        getDocument: function() {
            return transformations.toXML.getXML({HTMLTree: view.getBody(), metadata: view.getMetaData()});
        },
        isDirty: function() {
            return isDirty;
        },
        setDirty: function(dirty) {
            isDirty = dirty;
        }
    
    }
};