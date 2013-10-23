define(function() {

'use strict';

return function(sandbox) {

    var view = $(sandbox.getTemplate('main')()),
        documentIsDirty = true,
        documentEditedHere = false,
        wlxmlDocument;

    view.onShow = function() {
        if(documentIsDirty) {
            editor.setValue(wlxmlDocument.toXML());
            editor.gotoLine(0);
            sandbox.publish('documentSet');
            documentIsDirty = false;
        }
    }

    view.onHide = function() {
        if(documentEditedHere) {
            documentEditedHere = false;
            wlxmlDocument.loadXML(editor.getValue());
        }
    }
    
    var editor = ace.edit(view.find('#rng-sourceEditor-editor')[0]),
        session = editor.getSession();
    editor.setTheme("ace/theme/chrome");
    session.setMode("ace/mode/xml")
    session.setUseWrapMode(true);
    
    $('textarea', view).on('keyup', function() {
        documentEditedHere = true;
    });
    
    editor.getSession().on('change', function() {
        documentEditedHere = true;
    });
    return {
        start: function() {
            sandbox.publish('ready');
        },
        getView: function() {
            return view;
        },
        setDocument: function(document) {
            wlxmlDocument = document;
            wlxmlDocument.on('change', function() {
                documentIsDirty = true;
            });
        },
        getDocument: function() {
            return editor.getValue();
        }
    };
};

});