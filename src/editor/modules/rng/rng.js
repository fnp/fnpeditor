define([
'./documentSummary',
'libs/underscore',
'fnpjs/layout',
'fnpjs/vbox',
'fnpjs/logging/logging',
'views/tabs/tabs',
'libs/text!./mainLayout.html',
'libs/text!./editingLayout.html',
'libs/text!./diffLayout.html',
], function(documentSummary, _, layout, vbox, logging, tabs, mainLayoutTemplate, visualEditingLayoutTemplate, diffLayoutTemplate) {

'use strict';

return function(sandbox) {

    /* globals gettext */

    var logger = logging.getLogger('editor.modules.rng');
    
    function addMainTab(title, slug, view) {
        views.mainTabs.addTab(title, slug, view);
    }
     
    var commands = {
        highlightDocumentElement: function(element, origin) {
            ///'nodeBreadCrumbs', 'nodeFamilyTree'
            ['documentCanvas', 'nodeFamilyTree'].forEach(function(moduleName) {
                if(!origin || moduleName !== origin) {
                    sandbox.getModule(moduleName).highlightElement(element);
                }
            });
        },
        dimDocumentElement: function(element, origin) {
            //'nodeBreadCrumbs', 'nodeFamilyTree'
            ['documentCanvas', 'nodeFamilyTree'].forEach(function(moduleName) {
                if(!origin || moduleName !== origin) {
                    sandbox.getModule(moduleName).dimElement(element);
                }
            });
        },
        jumpToDocumentElement: function(element) {
            sandbox.getModule('documentCanvas').jumpToElement(element);
        },
        refreshCanvasSelection: function(selection) {
            var fragment = selection.toDocumentFragment(),
                elementParent;
            
            sandbox.getModule('documentToolbar').setDocumentFragment(fragment);
            
            if(fragment && fragment.node) {
                elementParent = fragment.node.getNearestElementNode();
                sandbox.getModule('nodePane').setNodeElement(elementParent);
                sandbox.getModule('nodeFamilyTree').setElement(fragment.node);
                sandbox.getModule('nodeBreadCrumbs').setNodeElement(elementParent);
                sandbox.getModule('metadataEditor').setNodeElement(elementParent);
            } else {
                sandbox.getModule('nodePane').setNodeElement(null);
                sandbox.getModule('nodeFamilyTree').setElement(null);
                sandbox.getModule('nodeBreadCrumbs').setNodeElement(null);
                sandbox.getModule('metadataEditor').setNodeElement(null);
            }
        },
    };
    

    var views = {
        mainLayout: new layout.Layout(mainLayoutTemplate),
        mainTabs: (new tabs.View()).render(),
        visualEditing: new layout.Layout(visualEditingLayoutTemplate),
        visualEditingSidebar: (new tabs.View({stacked: true})).render(),
        currentNodePaneLayout: new vbox.VBox(),
        diffLayout: new layout.Layout(diffLayoutTemplate)
    };
    
    views.visualEditing.setView('rightColumn', views.visualEditingSidebar.getAsView());
    addMainTab(gettext('Editor'), 'editor', views.visualEditing.getAsView());
    addMainTab(gettext('Source'), 'sourceEditor',  '');
    addMainTab(gettext('History'), 'history', views.diffLayout.getAsView());
    
    sandbox.getDOM().append(views.mainLayout.getAsView());
    
    views.visualEditingSidebar.addTab({icon: 'pencil'}, 'edit', views.currentNodePaneLayout.getAsView());

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
        ready: function(usingDraft, draftTimestamp) {
            views.mainLayout.setView('mainView', views.mainTabs.getAsView());
            
            documentSummary.init(sandbox.getConfig().documentSummaryView);
            documentSummary.render(sandbox.getModule('data').getDocumentProperties());
            documentSummary.setDraftField(usingDraft ? (draftTimestamp || '???') : '-');
            views.currentNodePaneLayout.appendView(documentSummary.dom);

            sandbox.getModule('mainBar').setCommandEnabled('drop-draft', usingDraft);
            sandbox.getModule('mainBar').setCommandEnabled('save', usingDraft);

            _.each(['sourceEditor', 'documentCanvas', 'documentToolbar', 'metadataEditor', 'nodeBreadCrumbs', 'mainBar', 'indicator', 'documentHistory', 'diffViewer', 'statusBar'], function(moduleName) {
                sandbox.getModule(moduleName).start();
            });
            
            wlxmlDocument = sandbox.getModule('data').getDocument();
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
                local: gettext('Local copy saved')
            };
            documentIsDirty = false;
            
            sandbox.getModule('indicator').clearMessage({message: msg[what]});
            if(status === 'success' && what === 'remote') {
                sandbox.getModule('mainBar').setVersion(data.version);
                documentSummary.render(data);
                documentSummary.setDraftField('-');
                sandbox.getModule('mainBar').setCommandEnabled('drop-draft', false);
                sandbox.getModule('mainBar').setCommandEnabled('save', false);
            }
            if(what === 'local') {
                documentSummary.setDraftField(data.timestamp);
                sandbox.getModule('mainBar').setCommandEnabled('drop-draft', true);
                sandbox.getModule('mainBar').setCommandEnabled('save', true);
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
            sandbox.getModule('indicator').clearMessage({message:'Wersja ' + version + ' przywrócona'});
            sandbox.getModule('mainBar').setVersion(version);
        }
    };
    
    eventHandlers.mainBar = {
        ready: function() {
            sandbox.getModule('mainBar').setVersion(sandbox.getModule('data').getDocumentProperties().version);
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
        
        nodeHovered: function(canvasNode) {
            commands.highlightDocumentNode(canvasNode);
        },
        
        nodeBlured: function(canvasNode) {
            commands.dimDocumentNode(canvasNode);
        },

        selectionChanged: function(selection) {
            commands.refreshCanvasSelection(selection);
        }
    };

    eventHandlers.nodePane = {
        ready: function() {
            views.currentNodePaneLayout.appendView(sandbox.getModule('nodePane').getView());
        }
    };
    
    eventHandlers.metadataEditor = {
        ready: function() {
            sandbox.getModule('metadataEditor').setDocument(sandbox.getModule('data').getDocument());
            views.visualEditingSidebar.addTab({icon: 'info-sign'}, 'metadataEditor', sandbox.getModule('metadataEditor').getView());
        }
    };
    
    eventHandlers.nodeFamilyTree = {
        ready: function() {
            views.currentNodePaneLayout.appendView(sandbox.getModule('nodeFamilyTree').getView());
        },
        nodeEntered: function(node) {
            commands.highlightDocumentElement(node, 'nodeFamilyTree');
        },
        nodeLeft: function(node) {
            commands.dimDocumentElement(node, 'nodeFamilyTree');
        },
        nodeClicked: function(node) {
            commands.jumpToDocumentElement(node);
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
    
    eventHandlers.nodeBreadCrumbs = {
        ready: function() {
            views.visualEditing.setView('statusBar', sandbox.getModule('nodeBreadCrumbs').getView());
        },
        elementEntered: function(element) {
            commands.highlightDocumentElement(element, 'nodeBreadCrumbs');
        },
        elementLeft: function(element) {
            commands.dimDocumentElement(element, 'nodeBreadCrumbs');
        },
        elementClicked: function(element) {
            commands.jumpToDocumentElement(element);
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
        displayVersion: function(event) {
            /* globals window */
            window.open('/' + gettext('editor') + '/' + sandbox.getModule('data').getDocumentId() + '?version=' + event.version, _.uniqueId());
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
        }
        event.returnValue = txt; // FF
        return txt; // Chrome
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