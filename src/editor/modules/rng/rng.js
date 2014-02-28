define([
'libs/underscore',
'fnpjs/layout',
'fnpjs/vbox',
'views/tabs/tabs',
'libs/text!./mainLayout.html',
'libs/text!./editingLayout.html',
'libs/text!./diffLayout.html',
], function(_, layout, vbox, tabs, mainLayoutTemplate, visualEditingLayoutTemplate, diffLayoutTemplate) {

'use strict';

return function(sandbox) {

    /* globals gettext */
    
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
        updateCurrentNodeElement: function(nodeElement) {
            sandbox.getModule('nodePane').setNodeElement(nodeElement);
            sandbox.getModule('nodeFamilyTree').setElement(nodeElement);
            sandbox.getModule('nodeBreadCrumbs').setNodeElement(nodeElement);
            sandbox.getModule('documentToolbar').setNodeElement(nodeElement);
            sandbox.getModule('metadataEditor').setNodeElement(nodeElement);
        },
        updateCurrentTextElement: function(textElement) {
            sandbox.getModule('nodeFamilyTree').setElement(textElement);
        }
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
        ready: function() {
            views.mainLayout.setView('mainView', views.mainTabs.getAsView());
            
            _.each(['sourceEditor', 'documentCanvas', 'documentToolbar', 'nodePane', 'metadataEditor', 'nodeFamilyTree', 'nodeBreadCrumbs', 'mainBar', 'indicator', 'documentHistory', 'diffViewer'], function(moduleName) {
                sandbox.getModule(moduleName).start();
            });
            
            wlxmlDocument = sandbox.getModule('data').getDocument();
            documentIsDirty = false;
            wlxmlDocument.on('change', function() {
                documentIsDirty = true;
            });
            wlxmlDocument.on('contentSet', function() {
                documentIsDirty = true;
            });
        },
        savingStarted: function(what) {
            var msg = {
                remote: gettext('Saving document'),
                local: gettext('Saving local copy')
            };
            sandbox.getModule('mainBar').setCommandEnabled('save', false);
            sandbox.getModule('indicator').showMessage(msg[what] + '...');
        },
        savingEnded: function(status, what, current_version) {
            void(status);
            var msg = {
                remote: gettext('Document saved'),
                local: gettext('Local copy saved')
            };
            documentIsDirty = false;
            sandbox.getModule('mainBar').setCommandEnabled('save', true);
            sandbox.getModule('indicator').clearMessage({message: msg[what]});
            sandbox.getModule('mainBar').setVersion(current_version);
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
            sandbox.getModule('mainBar').setCommandEnabled('save', true);
            sandbox.getModule('indicator').clearMessage({message:'Wersja ' + version + ' przywrócona'});
            sandbox.getModule('mainBar').setVersion(version);
        }
    };
    
    eventHandlers.mainBar = {
        ready: function() {
            sandbox.getModule('mainBar').setVersion(sandbox.getModule('data').getDocumentVersion());
            views.mainLayout.setView('topPanel', sandbox.getModule('mainBar').getView());
        },
        'cmd.save': function() {
            sandbox.getModule('data').saveDocument();
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
        
        currentTextElementSet: function(textElement) {
            commands.updateCurrentTextElement(textElement);
        },

        currentNodeElementSet: function(nodeElement) {
            commands.updateCurrentNodeElement(nodeElement);
        },
        
        currentNodeElementChanged: function(nodeElement) {
            commands.updateCurrentNodeElement(nodeElement);
        },

        nodeHovered: function(canvasNode) {
            commands.highlightDocumentNode(canvasNode);
        },
        
        nodeBlured: function(canvasNode) {
            commands.dimDocumentNode(canvasNode);
        }
    };

    eventHandlers.nodePane = {
        ready: function() {
            views.currentNodePaneLayout.appendView(sandbox.getModule('nodePane').getView());
        },
        
        nodeElementChange: function(attr, value) {
            sandbox.getModule('documentCanvas').modifyCurrentNodeElement(attr, value);
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
        },
        command: function(cmd, params) {
            sandbox.getModule('documentCanvas').command(cmd, params);
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
            sandbox.getModule('data').start();
        },
        handleEvent: function(moduleName, eventName, args) {
            if(eventHandlers[moduleName] && eventHandlers[moduleName][eventName]) {
                eventHandlers[moduleName][eventName].apply(eventHandlers, args);
            }
        }
    };
};

});