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

            this.node.on('mouseover', '.rng', function(e) { $(e.target).addClass('rng-hover')});
            this.node.on('mouseout', '.rng', function(e) { $(e.target).removeClass('rng-hover')});
            this.node.on('click', '.rng', function(e) {
                view._markSelected($(e.target));
            });

            this.node.on('keyup', function(e) {
                var anchor = $(window.getSelection().anchorNode);
                if(anchor[0].nodeType === Node.TEXT_NODE)
                    anchor = anchor.parent();
                if(!anchor.hasClass('rng'))
                    return;
                view._markSelected(anchor);
            });
        },
        getMetaData: function() {
            var toret = {};
            this.node.find('#rng-visualEditor-meta table tr').each(function() {
                var tr = $(this);
                var key = $(tr.find('td')[0]).html();
                var value = $(tr.find('td input')[0]).val();
                toret[key] = value;
            });
            console.log(toret);
            return toret;
        },
        setMetaData: function(metadata) {
            var table = this.node.find('#rng-visualEditor-meta table');
            table.empty();
            _.each(_.keys(metadata), function(key) {    
                $(sandbox.getTemplate('metaItem')({key: key, value: metadata[key]})).appendTo(table);
            });
        },
        setBody: function(HTMLTree) {
            this.node.find('#rng-visualEditor-content').html(HTMLTree);
        },
        getBody: function() {
            return this.node.find('#rng-visualEditor-content').html();
        }, 
        _markSelected: function(node) {
            this.node.find('.rng').removeClass('rng-current');
            node.addClass('rng-current');
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