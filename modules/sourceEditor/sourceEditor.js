define(function() {

return function(sandbox) {

    var view = $(sandbox.getTemplate('main')());
    var isDirty = false;
    
    var editor = ace.edit(view.find('#rng-sourceEditor-editor')[0]);
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/xml");
    $('textarea', view).on('keyup', function() {
        isDirty = true;
    });
    
    editor.getSession().on('change', function() {
        isDirty = true;
    })
    return {
        start: function() {
            sandbox.publish('ready');
        },
        getView: function() {
            return view;
        },
        setDocument: function(document) {
            editor.setValue(document);
            editor.gotoLine(0)
            isDirty = false;
        },
        getDocument: function() {
            return editor.getValue();
        },
        isDirty: function() {
            return isDirty;
        },
        setDirty: function(dirty) {
            isDirty = dirty;
        }
    
    }
};

});