define([
    './saveDialog',
    'wlxml/wlxml'

], function(saveDialog, wlxml) {

'use strict';

return function(sandbox) {

    var document_id = sandbox.getBootstrappedData().document_id;
    var document_version = sandbox.getBootstrappedData().version;
    var history = sandbox.getBootstrappedData().history;

    var wlxmlDocument = wlxml.WLXMLDocumentFromXML(sandbox.getBootstrappedData().document);
     
    
    function readCookie(name) {
        var nameEQ = escape(name) + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return unescape(c.substring(nameEQ.length, c.length));
        }
        return null;
    }
    
    $.ajaxSetup({
        crossDomain: false,
        beforeSend: function(xhr, settings) {
            if (!(/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type))) {
                xhr.setRequestHeader("X-CSRFToken", readCookie('csrftoken'));
            }
        }
    });
    
    var reloadHistory = function() {
        $.ajax({
            method: 'get',
            url: '/' + gettext('editor') + '/' + document_id + '/history',
            success: function(data) {
                history = data; 
                sandbox.publish('historyItemAdded', data.slice(-1)[0]);
            },
        });
    };
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        getDocument: function() {
            return wlxmlDocument;
        },
        commitDocument: function(newDocument, reason) {
            // doc = newDocument;
            // sandbox.publish('documentChanged', doc, reason);
        },
        saveDocument: function() {

            var dialog = saveDialog.create();
            dialog.on('save', function(event) {
                sandbox.publish('savingStarted');
                dialog.toggleButtons(false);
                $.ajax({
                    method: 'post',
                    url: '/' + gettext('editor') + '/' + document_id,
                    data: JSON.stringify({document:doc, description: event.data.description}),
                    success: function() {
                        event.success();
                        sandbox.publish('savingEnded', 'success');
                        reloadHistory();
                    },
                    error: function() {event.error(); sandbox.publish('savingEnded', 'error');}
                });
                console.log('save');
            });
            dialog.on('cancel', function() {
            });
            dialog.show();
            

        },
        getHistory: function() {
            return history;
        },
        fetchDiff: function(ver1, ver2) {
            $.ajax({
                method: 'get',
                url: '/' + gettext('editor') + '/' + document_id + '/diff',
                data: {from: ver1, to: ver2},
                success: function(data) {
                    sandbox.publish('diffFetched', {table: data, ver1: ver1, ver2: ver2});
                },
            });
        },
        restoreVersion: function(options) {
            if(options.version && options.description) {
                sandbox.publish('restoringStarted', {version: options.version});
                $.ajax({
                    method: 'post',
                    dataType: 'json',
                    url: '/' + gettext('editor') + '/' + document_id + '/revert',
                    data: JSON.stringify(options),
                    success: function(data) {
                        doc = data.document;
                        document_version = data.version;
                        reloadHistory();
                        sandbox.publish('documentReverted', data);
                    },
                }); 
            }
        },
        getDocumentId: function() {
            return document_id;
        },
        getDocumentVersion: function() {
            return document_version;
        }
    };
};

});