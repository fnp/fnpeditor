define(['libs/jquery', 'libs/ace/ace', 'libs/text!./template.html'], function($, ace, template) {

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

            documentIsDirty = false;
        }
    };

    view.onHide = function() {
        if(documentEditedHere) {
            commitDocument();
        }
    };

    var commitDocument = function() {
        documentEditedHere = false;
        wlxmlDocument.loadXML(editor.getValue());
    };

    var editor = ace.edit(view.find('#rng-sourceEditor-editor')[0]),
        session = editor.getSession();
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
            wlxmlDocument.on('contentSet', function() {
                documentIsDirty = true;
            });
        },
        changesCommited: function() {
            return !documentEditedHere;
        },
        commitChanges: commitDocument,
        getDocument: function() {
            return editor.getValue();
        }
    };
};

});