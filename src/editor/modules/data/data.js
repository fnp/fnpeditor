define([
    'libs/jquery',
    'views/dialog/dialog',
    'wlxml/wlxml',
    'wlxml/extensions/list/list',
    'fnpjs/logging/logging',
    'fnpjs/datetime',
    './document'
], function($, Dialog, wlxml, listExtension, logging, datetime, Document) {

'use strict';
/* global gettext, alert, window */

var logger = logging.getLogger('editor.modules.data');


return function(sandbox) {

    var data = sandbox.getBootstrappedData(),
        documentDirty = false,
        draftDirty = false,
        wlxmlDocument;


    var loadDocument = function(text, isDraft, draftTimestamp) {
        logger.debug('loading document');
        var xmlValid = true;
        try {
            wlxmlDocument = wlxml.WLXMLDocumentFromXML(text, {editorConfig: sandbox.getConfig()}, Document.Document);
        } catch(e) {
            logger.exception(e);
            alert(gettext('The content of this document seems to be invalid - only XML source editing will be possible. :(')); // TODO
            wlxmlDocument = wlxml.WLXMLDocumentFromXML(text, {}, Document.DumbDocument);
            xmlValid = false;
        }

        Object.keys(data)
            .filter(function(key) {
                return key !== 'history' && key !== 'document';
            })
            .forEach(function(key) {
                wlxmlDocument.setProperty(key, data[key]);
            });

        wlxmlDocument.registerExtension(listExtension);
        sandbox.getPlugins().forEach(function(plugin) {
            if(plugin.documentExtension) {
                wlxmlDocument.registerExtension(plugin.documentExtension);
            }
        });
        
        var modificationFlag = true;
        var handleChange = function() {
            documentDirty = true;
            draftDirty = true;
            modificationFlag = true;
        };
        wlxmlDocument.on('change', handleChange);
        wlxmlDocument.on('contentSet', handleChange);

        if(window.localStorage) {
            window.setInterval(function() {
                var timestamp = datetime.currentStrfmt(),
                    key = getLocalStorageKey();
                if(modificationFlag) {
                    modificationFlag = false;
                    return;
                }
                if(wlxmlDocument && documentDirty && draftDirty) {
                    logger.debug('Saving draft to local storage.');
                    sandbox.publish('savingStarted', 'local');
                    window.localStorage.setItem(key.content, wlxmlDocument.toXML());
                    window.localStorage.setItem(key.contentTimestamp, timestamp);
                    sandbox.publish('savingEnded', 'success', 'local', {timestamp: timestamp});
                    draftDirty = false;
                }
            }, sandbox.getConfig().autoSaveInterval || 2500);
        }
        sandbox.publish('ready', isDraft, draftTimestamp, xmlValid);
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
            url: sandbox.getConfig().documentHistoryUrl(data.document_id),
            success: function(history) {
                data.history = history;
                sandbox.publish('historyItemAdded', history.slice(-1)[0]);
            },
        });
    };

    var getLocalStorageKey = function(forVersion) {
        var base = 'draft-id:' + data.document_id + '-ver:' + (forVersion || wlxmlDocument.properties.version);
        return {
            content: base,
            contentTimestamp: base + '-content-timestamp'
        };
    };

   
    return {
        start: function() {
            var text;
            if(window.localStorage) {
                text = window.localStorage.getItem(getLocalStorageKey(data.version).content);

                var timestamp = window.localStorage.getItem(getLocalStorageKey(data.version).contentTimestamp),
                    usingDraft;
                if(text) {
                    logger.debug('Local draft exists');
                    var dialog = Dialog.create({
                        title: gettext('Local draft of a document exists'),
                        text: gettext('Unsaved local draft of this version of the document exists in your browser. Do you want to load it instead?'),
                        executeButtonText: gettext('Yes, restore local draft'),
                        cancelButtonText: gettext('No, use version loaded from the server')
                    });
                    dialog.on('cancel', function() {
                        logger.debug('Bootstrapped version chosen');
                        usingDraft = false;
                        text = sandbox.getBootstrappedData().document;
                        
                    });
                    dialog.on('execute', function(event) {
                        logger.debug('Local draft chosen');
                        usingDraft = true;
                        event.success();
                    });
                    dialog.show();
                    dialog.on('close', function() {
                        loadDocument(text, usingDraft, timestamp);
                    });
                } else {
                    loadDocument(sandbox.getBootstrappedData().document, false);
                }
            } else {
                loadDocument(sandbox.getBootstrappedData().document, false);
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
                    executeButtonText: gettext('Save'),
                    cancelButtonText: gettext('Cancel')
                });
            
            dialog.on('execute', function(event) {
                sandbox.publish('savingStarted', 'remote');

                var formData = event.formData;
                formData[documentSaveForm.content_field_name] = wlxmlDocument.toXML();
                formData[documentSaveForm.version_field_name] = wlxmlDocument.properties.version;
                if(sandbox.getConfig().jsonifySentData) {
                    formData = JSON.stringify(formData);
                }

                dialog.toggleButtons(false);
                $.ajax({
                    method: 'post',
                    url: sandbox.getConfig().documentSaveUrl(data.document_id),
                    data: formData,
                    success: function(data) {
                        event.success();
                        sandbox.publish('savingEnded', 'success', 'remote', data);

                        Object.keys(data)
                            .filter(function(key) {
                                return key !== 'text';
                            })
                            .forEach(function(key) {
                                wlxmlDocument.setProperty(key, data[key]);
                            });

                        reloadHistory();
                    },
                    error: function() {event.error(); sandbox.publish('savingEnded', 'error', 'remote');}
                });
            });
            dialog.on('cancel', function() {
            });
            dialog.show();
            

        },
        getHistory: function() {
            return data.history;
        },
        fetchDiff: function(ver1, ver2) {
            $.ajax({
                method: 'get',
                url: sandbox.getConfig().documentDiffUrl(data.document_id),
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
                    executeButtonText: gettext('Restore'),
                    cancelButtonText: gettext('Cancel')
                });

            dialog.on('execute', function(event) {
                var formData = event.formData;
                formData[documentRestoreForm.version_field_name] = version;
                sandbox.publish('restoringStarted', {version: version});
                if(sandbox.getConfig().jsonifySentData) {
                    formData = JSON.stringify(formData);
                }
                $.ajax({
                    method: 'post',
                    dataType: 'json',
                    url: sandbox.getConfig().documentRestoreUrl(data.document_id),
                    data: formData,
                    success: function(data) {
                        Object.keys(data)
                            .filter(function(key) {
                                return key !== 'document';
                            })
                            .forEach(function(key) {
                                wlxmlDocument.setProperty(key, data[key]);
                            });
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
        dropDraft: function() {
            logger.debug('Dropping a draft...');
            wlxmlDocument.loadXML(sandbox.getBootstrappedData().document);
            draftDirty = false;
            logger.debug('Draft dropped');
            sandbox.publish('draftDropped');
        }
    };
};

});