define([
    'libs/jquery',
    './saveDialog',
    'wlxml/wlxml',
    'wlxml/extensions/list/list'

], function($, saveDialog, wlxml, listExtension) {

'use strict';

return function(sandbox) {

    var document_id = sandbox.getBootstrappedData().document_id;
    var document_version = sandbox.getBootstrappedData().version;
    var history = sandbox.getBootstrappedData().history;

    var wlxmlDocument = wlxml.WLXMLDocumentFromXML(sandbox.getBootstrappedData().document);

    wlxmlDocument.registerExtension(listExtension);
    sandbox.getPlugins().forEach(function(plugin) {
        if(plugin.documentExtension) {
            wlxmlDocument.registerExtension(plugin.documentExtension);
        }
    });
     
    
    function readCookie(name) {
        /* global escape, unescape, document */
        var nameEQ = escape(name) + '=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return unescape(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    }
    
    $.ajaxSetup({
        crossDomain: false,
        beforeSend: function(xhr, settings) {
            if (!(/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type))) {
                xhr.setRequestHeader('X-CSRFToken', readCookie('csrftoken'));
            }
        }
    });
    
    var reloadHistory = function() {
        $.ajax({
            method: 'get',
            url: sandbox.getConfig().documentHistoryUrl(document_id),
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
        saveDocument: function() {
            var documentSaveForm = $.extend({
                        fields: [],
                        content_field_name: 'text',
                        version_field_name: 'version'
                    },
                    sandbox.getConfig().documentSaveForm
                ),
                dialog = saveDialog.create({fields: documentSaveForm.fields});
            
            dialog.on('save', function(event) {
                sandbox.publish('savingStarted');

                var formData = event.formData;
                formData[documentSaveForm.content_field_name] = wlxmlDocument.toXML();
                formData[documentSaveForm.version_field_name] = document_version;
                if(sandbox.getConfig().jsonifySentData) {
                    formData = JSON.stringify(formData);
                }

                dialog.toggleButtons(false);
                $.ajax({
                    method: 'post',
                    url: sandbox.getConfig().documentSaveUrl(document_id),
                    data: formData,
                    success: function(data) {
                        event.success();
                        sandbox.publish('savingEnded', 'success', data.version);
                        document_version = data.version;
                        reloadHistory();
                    },
                    error: function() {event.error(); sandbox.publish('savingEnded', 'error');}
                });
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
                url: sandbox.getConfig().documentDiffUrl(document_id),
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
                    url: sandbox.getConfig().documentRestoreUrl(document_id),
                    data: JSON.stringify(options),
                    success: function(data) {
                        document_version = data.current_version;
                        reloadHistory();
                        wlxmlDocument.loadXML(data.document);
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