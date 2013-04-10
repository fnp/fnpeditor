rng.modules.visualEditor = function(sandbox) {

    var view = $(sandbox.getTemplate('main')());
    var isDirty = false;
    
    var document2html = function(document) {
        return document;
    }
    
    var html2document = function() {
        return $('#rng-visualEditor-content').text();
    }
    
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
        setDocument: function(document) {
            $('#rng-visualEditor-content', view).html(document2html(document));
            isDirty = false;
        },
        getDocument: function() {
            return html2document();
        },
        isDirty: function() {
            return isDirty;
        },
        setDirty: function(dirty) {
            isDirty = dirty;
        }
    
    }
};