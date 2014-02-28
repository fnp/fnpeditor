define([
    'libs/jquery',
    './dialog',
    'wlxml/wlxml',
    'wlxml/extensions/list/list',
    'fnpjs/logging/logging',
], function($, Dialog, wlxml, listExtension, logging) {

'use strict';
/* global gettext, alert, window */

var logger = logging.getLogger('editor.modules.data'),
    stubDocument = '<section><div>' + gettext('This is an empty document.') + '</div></section>';


return function(sandbox) {

    var document_id = sandbox.getBootstrappedData().document_id;
    var document_version = sandbox.getBootstrappedData().version;
    var history = sandbox.getBootstrappedData().history;
    var documentDirty = false;
    var draftDirty = false;

    var wlxmlDocument, text;

    var loadDocument = function(text) {
        logger.debug('loading document');
        try {
            wlxmlDocument = wlxml.WLXMLDocumentFromXML(text);
        } catch(e) {
            logger.exception(e);
            alert(gettext('This document contains errors and can\'t be loaded. :(')); // TODO
            wlxmlDocument = wlxml.WLXMLDocumentFromXML(stubDocument);
        }

        wlxmlDocument.registerExtension(listExtension);
        sandbox.getPlugins().forEach(function(plugin) {
            if(plugin.documentExtension) {
                wlxmlDocument.registerExtension(plugin.documentExtension);
            }
        });
        
        var modificationFlag = true;
        wlxmlDocument.on('change', function() {
            documentDirty = true;
            draftDirty = true;
            modificationFlag = true;
        });
        if(window.localStorage) {
            window.setInterval(function() {
                if(modificationFlag) {
                    modificationFlag = false;
                    return;
                }
                if(wlxmlDocument && documentDirty && draftDirty) {
                    logger.debug('Saving draft to local storage.');
                    sandbox.publish('savingStarted');
                    window.localStorage.setItem(getLocalStorageKey(), wlxmlDocument.toXML());
                    sandbox.publish('savingEnded', 'success');
                    draftDirty = false;
                }
            }, sandbox.getConfig().autoSaveInterval || 2500);
        }
        sandbox.publish('ready');
    };
    
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

    var getLocalStorageKey = function() {
        return 'draft-id:' + document_id + '-ver:' + document_version;
    };

   
    return {
        start: function() {

            if(window.localStorage) {
                text = window.localStorage.getItem(getLocalStorageKey());
                if(text) {
                    logger.debug('Local draft exists');
                    var dialog = Dialog.create({
                        title: gettext('Local draft of a document exists'),
                        text: gettext('Unsaved local draft of this version of the document exists in your browser. Do you want to load it instead?'),
                        submitButtonText: gettext('Yes, restore local draft'),
                        cancelButtonText: gettext('No, use version loaded from the server')
                    });
                    dialog.on('cancel', function() {
                        logger.debug('Bootstrapped version chosen');
                        text = sandbox.getBootstrappedData().document;
                        
                    });
                    dialog.on('save', function(event) {
                        logger.debug('Local draft chosen');
                        event.success();
                    });
                    dialog.show();
                    dialog.on('close', function() {
                        loadDocument(text);
                    });
                } else {
                    loadDocument(sandbox.getBootstrappedData().document);
                }
            } else {
                loadDocument(sandbox.getBootstrappedData().document);
            }
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
                dialog = Dialog.create({
                    fields: documentSaveForm.fields,
                    title: gettext('Save Document'),
                    submitButtonText: gettext('Save')
                });
            
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
        restoreVersion: function(version) {
            var documentRestoreForm = $.extend({
                        fields: [],
                        version_field_name: 'version'
                    },
                    sandbox.getConfig().documentRestoreForm
                ),
                dialog = Dialog.create({
                    fields: documentRestoreForm.fields,
                    title: gettext('Restore Version'),
                    submitButtonText: gettext('Restore')
                });

            dialog.on('save', function(event) {
                var formData = event.formData;
                formData[documentRestoreForm.version_field_name] = version;
                sandbox.publish('restoringStarted', {version: version});
                if(sandbox.getConfig().jsonifySentData) {
                    formData = JSON.stringify(formData);
                }
                $.ajax({
                    method: 'post',
                    dataType: 'json',
                    url: sandbox.getConfig().documentRestoreUrl(document_id),
                    data: formData,
                    success: function(data) {
                        document_version = data.version;
                        reloadHistory();
                        wlxmlDocument.loadXML(data.document);
                        documentDirty = false;
                        sandbox.publish('documentReverted', data.version);
                        event.success();
                    },
                });
            });
            dialog.show();
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