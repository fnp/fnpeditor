rng.modules.visualEditor = function(sandbox) {
    var transformations = rng.modules.visualEditor.transformations;

    var view = $(sandbox.getTemplate('main')());
    var isDirty = false;
    
    
    $('#rng-visualEditor-content', view).on('keyup', function() {
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
            isDirty = false;
        },
        getDocument: function() {
            return transformations.toXML.getXML({HTMLTree: $('#rng-visualEditor-content').text(), metadata: {}});
        },
        isDirty: function() {
            return isDirty;
        },
        setDirty: function(dirty) {
            isDirty = dirty;
        }
    
    }
};