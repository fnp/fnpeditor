define([
'./documentSummary',
'libs/underscore',
'fnpjs/layout',
'fnpjs/logging/logging',
'views/tabs/tabs',
'libs/text!./mainLayout.html',
'libs/text!./editingLayout.html',
'libs/text!./diffLayout.html',
], function(documentSummary, _, layout, logging, tabs, mainLayoutTemplate, visualEditingLayoutTemplate, diffLayoutTemplate) {

'use strict';

return function(sandbox) {

    /* globals gettext */

    var logger = logging.getLogger('editor.modules.rng');
    
    function addMainTab(title, slug, view) {
        views.mainTabs.addTab(title, slug, view);
    }
     
    var commands = {
        refreshCanvasSelection: function(selection) {
            var fragment = selection.toDocumentFragment();
            sandbox.getModule('documentToolbar').setDocumentFragment(fragment);
        },
    };
    

    var views = {
        mainLayout: new layout.Layout(mainLayoutTemplate),
        mainTabs: (new tabs.View()).render(),
        visualEditing: new layout.Layout(visualEditingLayoutTemplate),
        diffLayout: new layout.Layout(diffLayoutTemplate)
    };
    
    addMainTab(gettext('Editor'), 'editor', views.visualEditing.getAsView());
    addMainTab(gettext('Source'), 'sourceEditor',  '');
    addMainTab(gettext('History'), 'history', views.diffLayout.getAsView());
    
    sandbox.getDOM().append(views.mainLayout.getAsView());
    
    var wlxmlDocument, documentIsDirty;
    
    /* Events handling */
    
    var eventHandlers = {};
     
    eventHandlers.sourceEditor = {
        ready: function() {
            addMainTab(gettext('Source'), 'sourceEditor',  sandbox.getModule('sourceEditor').getView());
            sandbox.getModule('sourceEditor').setDocument(sandbox.getModule('data').getDocument());
        }
    };
    
    eventHandlers.data = {
        ready: function(usingDraft, draftTimestamp, xmlValid) {
            wlxmlDocument = sandbox.getModule('data').getDocument();

            views.mainLayout.setView('mainView', views.mainTabs.getAsView());
            
            documentSummary.init(sandbox.getConfig().documentSummaryView, wlxmlDocument);
            documentSummary.render();
            documentSummary.setDraftField(usingDraft ? (draftTimestamp || '???') : '-');
            sandbox.getModule('mainBar').setSummaryView(documentSummary.dom);

            sandbox.getModule('mainBar').setCommandEnabled('drop-draft', usingDraft);
            sandbox.getModule('mainBar').setCommandEnabled('save', usingDraft);

            
            var toStart = ['sourceEditor', 'documentToolbar', 'mainBar', 'indicator', 'documentHistory', 'diffViewer', 'statusBar'];
            if(xmlValid) {
                toStart.push('documentCanvas');
            }
            _.each(toStart, function(moduleName) {
                sandbox.getModule(moduleName).start();
            });
            
            documentIsDirty = false;
            wlxmlDocument.on('change', function() {
                documentIsDirty = true;
                sandbox.getModule('mainBar').setCommandEnabled('save', true);
            });
            wlxmlDocument.on('contentSet', function() {
                documentIsDirty = true;
            });
        },
        draftDropped: function() {
            documentSummary.setDraftField('-');
            sandbox.getModule('mainBar').setCommandEnabled('drop-draft', false);
            sandbox.getModule('mainBar').setCommandEnabled('save', false);
        },
        savingStarted: function(what) {
            var msg = {
                remote: gettext('Saving document'),
                local: gettext('Saving local copy')
            };
            sandbox.getModule('mainBar').setCommandEnabled('save', false);
            sandbox.getModule('indicator').showMessage(msg[what] + '...');
        },
        savingEnded: function(status, what, data) {
            void(status);
            var msg = {
                remote: gettext('Document saved'),
                local: gettext('Local copy saved'),
                error: gettext('Failed to save')
            };
            documentIsDirty = false;

            if (status === 'success') {
                sandbox.getModule('indicator').clearMessage({message: msg[what]});
                if (what === 'remote') {
                    documentSummary.setDraftField('-');
                    sandbox.getModule('mainBar').setCommandEnabled('drop-draft', false);
                    sandbox.getModule('mainBar').setCommandEnabled('save', false);
                }
                if (what === 'local') {
                    documentSummary.setDraftField(data.timestamp);
                    sandbox.getModule('mainBar').setCommandEnabled('drop-draft', true);
                    sandbox.getModule('mainBar').setCommandEnabled('save', true);
                }
            } else {
                sandbox.getModule('indicator').clearMessage({message: msg[status]});
            }
        },
        restoringStarted: function(event) {
            sandbox.getModule('mainBar').setCommandEnabled('save', false);
            sandbox.getModule('indicator').showMessage(gettext('Restoring version ') + event.version + '...');
        },
        historyItemAdded: function(item) {
            sandbox.getModule('documentHistory').addHistory([item], {animate: true});
        },
        diffFetched: function(diff) {
            sandbox.getModule('diffViewer').setDiff(diff);
        },
        documentReverted: function(version) {
            documentIsDirty = false;
            sandbox.getModule('indicator').clearMessage({message:gettext('Revision restored')});
        },
        publishingStarted: function(version) {
            sandbox.getModule('indicator').showMessage(gettext('Publishing...'));
        },
        documentPublished: function(version) {
            sandbox.getModule('indicator').clearMessage({message:'Published.'});
        }
    };
    
    eventHandlers.mainBar = {
        ready: function() {
            views.mainLayout.setView('topPanel', sandbox.getModule('mainBar').getView());
        },
        'cmd.save': function() {
            var sourceEditor = sandbox.getModule('sourceEditor');
            if(!sourceEditor.changesCommited()) {
                logger.debug('Source editor has uncommited changes, commiting...');
                sourceEditor.commitChanges();
            }
            sandbox.getModule('data').saveDocument();
        },
        'cmd.drop-draft': function() {
            sandbox.getModule('data').dropDraft();
        }
    };
    
    eventHandlers.indicator = {
        ready: function() {
            views.mainLayout.setView('messages', sandbox.getModule('indicator').getView());
        }
    };
    

    
    eventHandlers.documentCanvas = {
        ready: function() {
            sandbox.getModule('documentCanvas').setDocument(sandbox.getModule('data').getDocument());
            views.visualEditing.setView('leftColumn', sandbox.getModule('documentCanvas').getView());
        },
        
        selectionChanged: function(selection) {
            commands.refreshCanvasSelection(selection);
        }
    };
    
    eventHandlers.documentToolbar = {
        ready: function() {
            views.visualEditing.setView('toolbar', sandbox.getModule('documentToolbar').getView());
            sandbox.getModule('documentToolbar').setCanvas(sandbox.getModule('documentCanvas').getCanvas());
        },
        actionExecuted: function(action, ret) {
            sandbox.getModule('documentCanvas').onAfterActionExecuted(action, ret);
        }
    };
    
    eventHandlers.documentHistory = {
        ready: function() {
            sandbox.getModule('documentHistory').addHistory(sandbox.getModule('data').getHistory());
            views.diffLayout.setView('left', sandbox.getModule('documentHistory').getView());
        },
        compare: function(ver1, ver2) {
            sandbox.getModule('data').fetchDiff(ver1, ver2);
        },
        restoreVersion: function(version) {
            sandbox.getModule('data').restoreVersion(version);
        },
        displayVersion: function(revision) {
            /* globals window */
            //window.open(sandbox.getConfig().documentPreviewUrl(revision), _.uniqueId());
            window.open(sandbox.getConfig().documentPreviewUrl(revision), 'preview');
        },
        publishVersion: function(version) {
            sandbox.getModule('data').publishVersion(version);
        }
    };
    
    eventHandlers.diffViewer = {
        ready: function() {
            views.diffLayout.setView('right', sandbox.getModule('diffViewer').getView());
        }
    };

    eventHandlers.statusBar = {
        ready: function() {
            views.mainLayout.setView('bottomPanel', sandbox.getModule('statusBar').getView());
        }
    };

    eventHandlers.__all__ = {
        actionHovered: function(action) {
            sandbox.getModule('statusBar').showAction(action);
        },
        actionOff: function() {
            sandbox.getModule('statusBar').clearAction();
        }
    };

    window.addEventListener('beforeunload', function(event) {
        var txt = gettext('Do you really want to exit?');
        if(documentIsDirty) {
            txt += ' ' + gettext('Document contains unsaved changes!');
            event.returnValue = txt; // FF
            return txt; // Chrome
        }
    });
    
    /* api */
    
    return {
        start: function() {
            sandbox.registerActionsAppObject({
                getUser: function() {
                    return sandbox.getConfig().user;
                }
            });
            sandbox.getModule('data').start();
        },
        handleEvent: function(moduleName, eventName, args) {
            var eventRepr = moduleName + '.' + eventName;
            if(eventHandlers[moduleName] && eventHandlers[moduleName][eventName]) {
                logger.debug('Handling event ' + eventRepr);
                eventHandlers[moduleName][eventName].apply(eventHandlers, args);
                return;
            }

            if(eventHandlers.__all__[eventName]) {
                logger.debug('Handling event ' + eventRepr);
                eventHandlers.__all__[eventName].apply(eventHandlers.__all__, args);
                return;
            }

            logger.warning('No event handler for ' + eventRepr);
        }
    };
};

});