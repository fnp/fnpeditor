define(function() {

'use strict';

return function(sandbox) {

    var view = $(sandbox.getTemplate('main')());
    
    var editor = ace.edit(view.find('#rng-sourceEditor-editor')[0]);
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/xml");
    $('textarea', view).on('keyup', function() {
        sandbox.publish('xmlChanged');
    });
    
    editor.getSession().on('change', function() {
        sandbox.publish('xmlChanged');
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
            sandbox.publish('documentSet');
        },
        getDocument: function() {
            return editor.getValue();
        }
    }
};

});