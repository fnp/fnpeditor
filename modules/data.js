rng.modules.data = function(sandbox) {

    var document = sandbox.getBootstrappedData().document;

    return {
        start: function() {
            sandbox.publish('ready');
        },
        getDocument: function() {
            return document;
        },
        commitDocument: function(newDocument, reason) {
            document = newDocument;
            sandbox.publish('documentChanged', document, reason);
        }
        
    }

};