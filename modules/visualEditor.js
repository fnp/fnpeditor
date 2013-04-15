rng.modules.visualEditor = function(sandbox) {
    var transformations = rng.modules.visualEditor.transformations;

    var view = $(sandbox.getTemplate('main')());
    var isDirty = false;
    
    var getMetaData = function() {
        var toret = {};
        view.find('#rng-visualEditor-meta table tr').each(function() {
            var tr = $(this);
            var key = $(tr.find('td')[0]).html();
            var value = $(tr.find('td input')[0]).val();
            toret[key] = value;
        });
        console.log(toret);
        return toret;
    };
    
    var setMetaData = function(metadata) {
        var table = view.find('#rng-visualEditor-meta table');
        table.empty();
        _.each(_.keys(metadata), function(key) {    
            $(sandbox.getTemplate('metaItem')({key: key, value: metadata[key]})).appendTo(table);
        });
    };
    
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
            return view;
        },
        setDocument: function(xml) {
            var transformed = transformations.fromXML.getDocumentDescription(xml);
            $('#rng-visualEditor-content', view).html(transformed.HTMLTree);
            setMetaData(transformed.metadata);
            isDirty = false;
        },
        getDocument: function() {
            return transformations.toXML.getXML({HTMLTree: $('#rng-visualEditor-content').html(), metadata: getMetaData()});
        },
        isDirty: function() {
            return isDirty;
        },
        setDirty: function(dirty) {
            isDirty = dirty;
        }
    
    }
};