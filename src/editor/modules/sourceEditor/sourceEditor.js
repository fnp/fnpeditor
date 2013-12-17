define(['libs/jquery', 'libs/text!./template.html'], function($, template) {

'use strict';

return function(sandbox) {

    var view = $(template),
        documentIsDirty = true,
        documentEditedHere = false,
        wlxmlDocument;

    view.onShow = function() {
        if(documentIsDirty) {
            editor.setValue(wlxmlDocument.toXML());
            editor.gotoLine(0);
            documentEditedHere = false;

            sandbox.publish('documentSet');
            documentIsDirty = false;
        }
    };

    view.onHide = function() {
        if(documentEditedHere) {
            documentEditedHere = false;
            wlxmlDocument.loadXML(editor.getValue());
        }
    };
    
    /* globals ace */
    var editor = ace.edit(view.find('#rng-sourceEditor-editor')[0]),
        session = editor.getSession();
    editor.setTheme('ace/theme/chrome');
    session.setMode('ace/mode/xml');
    session.setUseWrapMode(true);
    
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