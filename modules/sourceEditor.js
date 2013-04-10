rng.modules.sourceEditor = function(sandbox) {

    var view = $(sandbox.getTemplate('main')());
    var isDirty = false;
    
    $('textarea', view).on('keyup', function() {
        isDirty = true;
    });
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        getView: function() {
            return view;
        },
        setDocument: function(document) {
            $('textarea', view).val(document);
            isDirty = false;
        },
        getDocument: function() {
            return $('textarea', view).val();
        },
        isDirty: function() {
            return isDirty;
        },
        setDirty: function(dirty) {
            isDirty = dirty;
        }
    
    }
};