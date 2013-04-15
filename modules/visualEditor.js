rng.modules.visualEditor = function(sandbox) {
    var transformations = rng.modules.visualEditor.transformations;

    var view = {
        node: $(sandbox.getTemplate('main')()),
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
            return this.find('#rng-visualEditor-content').html();
        }   
    };
    
    var isDirty = false;
    
    
    $('#rng-visualEditor-content', view).on('keyup', function() {
        isDirty = true;
    });
    
    $('#rng-visualEditor-meta', view).on('keyup', function() {
        isDirty = true;
    });
    
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