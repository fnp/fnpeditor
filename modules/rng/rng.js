define([
'fnpjs/layout',
'fnpjs/vbox',
'views/tabs/tabs',
'libs/text!./mainLayout.html',
'libs/text!./editingLayout.html',
], function(layout, vbox, tabs, mainLayoutTemplate, visualEditingLayoutTemplate) {

'use strict';

return function(sandbox) {
    
    function addMainTab(title, slug, view) {
        views.mainTabs.addTab(title, slug, view);
    }
    
    function tabIsDirty(slug) {
        if(slug === 'editor' && (dirty.documentCanvas || dirty.metadataEditor))
            return true;
        if(slug === 'sourceEditor' && dirty.sourceEditor)
            return true;
        return false;
    }
    
    var dirty = {
        sourceEditor: false,
        documentCanvas: false,
        metadataEditor: false,
    };
    
    var synchronizeTab = function(slug) {
        if(tabIsDirty(slug)) {
            if(slug === 'sourceEditor') {
                sandbox.getModule('data').commitDocument(sandbox.getModule('sourceEditor').getDocument(), 'source_edit');
            }
            if(slug === 'editor') {
                var doc = dirty.documentCanvas ? sandbox.getModule('documentCanvas').getDocument() : sandbox.getModule('data').getDocument();
                if(dirty.metadataEditor) {
                    doc = sandbox.getModule('metadataEditor').attachMetadata(doc);
                }
                sandbox.getModule('data').commitDocument(doc, 'edit');
            }
        }
    }
    
    var commands = {
        highlightDocumentNode: function(wlxmlNode, origin) {
            ['documentCanvas', 'nodeBreadCrumbs', 'nodeFamilyTree'].forEach(function(moduleName) {
                if(!origin || moduleName != origin)
                    sandbox.getModule(moduleName).highlightNode(wlxmlNode)
            });
        },
        dimDocumentNode: function(wlxmlNode, origin) {
            ['documentCanvas', 'nodeBreadCrumbs', 'nodeFamilyTree'].forEach(function(moduleName) {
                if(!origin || moduleName != origin)
                    sandbox.getModule(moduleName).dimNode(wlxmlNode)
            });
        },
        selectNode: function(wlxmlNode, origin) {
            sandbox.getModule('documentCanvas').selectNode(wlxmlNode);
            sandbox.getModule('nodePane').setNode(wlxmlNode);
            sandbox.getModule('nodeFamilyTree').setNode(wlxmlNode);
            sandbox.getModule('nodeBreadCrumbs').setNode(wlxmlNode);
            
        }
    }
    

    var views = {
        mainLayout: new layout.Layout(mainLayoutTemplate),
        mainTabs: (new tabs.View()).render(),
        visualEditing: new layout.Layout(visualEditingLayoutTemplate),
        visualEditingSidebar: (new tabs.View({stacked: true})).render(),
        currentNodePaneLayout: new vbox.VBox()
    }
    
    views.visualEditing.setView('rightColumn', views.visualEditingSidebar.getAsView());
    addMainTab('Edytor', 'editor', views.visualEditing.getAsView());
    
    sandbox.getDOM().append(views.mainLayout.getAsView());
    
    views.visualEditingSidebar.addTab({icon: 'pencil'}, 'edit', views.currentNodePaneLayout.getAsView());

    views.mainTabs.on('tabSelected', function(event) {
        if(event.prevSlug) {
            synchronizeTab(event.prevSlug);
        }
    });
    
    /* Events handling */
    
    var eventHandlers = {};
     
    eventHandlers.sourceEditor = {
        ready: function() {
            addMainTab(gettext('Source'), 'sourceEditor',  sandbox.getModule('sourceEditor').getView());
            sandbox.getModule('sourceEditor').setDocument(sandbox.getModule('data').getDocument());
        },
        xmlChanged: function() {
            dirty.sourceEditor = true;
        },
        documentSet: function() {
            dirty.sourceEditor = false;
        }
    };
    
    eventHandlers.data = {
        ready: function() {
            views.mainLayout.setView('mainView', views.mainTabs.getAsView());
            
            _.each(['sourceEditor', 'documentCanvas', 'documentToolbar', 'nodePane', 'metadataEditor', 'nodeFamilyTree', 'nodeBreadCrumbs', 'mainBar', 'indicator'], function(moduleName) {
                sandbox.getModule(moduleName).start();
            });
        },
        documentChanged: function(document, reason) {
            var modules = [];
            if(reason === 'source_edit')
                modules = ['documentCanvas', 'metadataEditor'];
            else if (reason === 'edit')
                modules = ['sourceEditor'];
                
            modules.forEach(function(moduleName) {
                sandbox.getModule(moduleName).setDocument(document);
            });
        },
        savingStarted: function() {
            sandbox.getModule('mainBar').setCommandEnabled('save', false);
            sandbox.getModule('indicator').showMessage(gettext('Saving...'));
        },
        savingEnded: function(status) {
            sandbox.getModule('mainBar').setCommandEnabled('save', true);
            sandbox.getModule('indicator').clearMessage();
        }
    }
    
    eventHandlers.mainBar = {
        ready: function() {
            views.mainLayout.setView('topPanel', sandbox.getModule('mainBar').getView());
        },
        'cmd.save': function() {
            synchronizeTab(views.mainTabs.getCurrentSlug());
            sandbox.getModule('data').saveDocument();
        }
    }
    
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
        documentSet: function() {
            dirty.documentCanvas = false;
        },
        
        nodeSelected: function(wlxmlNode) {
            commands.selectNode(wlxmlNode);
        },
        
        contentChanged: function() {
            dirty.documentCanvas = true;
        },
        
        nodeHovered: function(wlxmlNode) {
            commands.highlightDocumentNode(wlxmlNode);
        },
        
        nodeBlured: function(wlxmlNode) {
            commands.dimDocumentNode(wlxmlNode);
        }
    };

    eventHandlers.nodePane = {
        ready: function() {
            views.currentNodePaneLayout.appendView(sandbox.getModule('nodePane').getView());
        },
        
        nodeChanged: function(attr, value) {
            sandbox.getModule('documentCanvas').modifyCurrentNode(attr, value);
        }
    };
    
    eventHandlers.metadataEditor = {
        ready: function() {
            sandbox.getModule('metadataEditor').setDocument(sandbox.getModule('data').getDocument());
            views.visualEditingSidebar.addTab({icon: 'info-sign'}, 'metadataEditor', sandbox.getModule('metadataEditor').getView());
        },
        metadataChanged: function(metadata) {
            dirty.metadataEditor = true;
        },
        metadataSet: function() {
            dirty.metadataEditor = false;
        },
    };
    
    eventHandlers.nodeFamilyTree = {
        ready: function() {
            views.currentNodePaneLayout.appendView(sandbox.getModule('nodeFamilyTree').getView());
        },
        nodeEntered: function(wlxmlNode) {
            commands.highlightDocumentNode(wlxmlNode, 'nodeFamilyTree');
        },
        nodeLeft: function(wlxmlNode) {
            commands.dimDocumentNode(wlxmlNode, 'nodeFamilyTree');
        },
        nodeSelected: function(wlxmlNode) {
            commands.selectNode(wlxmlNode);
        }
    };
    
    eventHandlers.documentToolbar = {
        ready: function() {
            views.visualEditing.setView('toolbar', sandbox.getModule('documentToolbar').getView());
        },
        toggleGrid: function(toggle) {
            sandbox.getModule('documentCanvas').toggleGrid(toggle);
        },
        newNodeRequested: function(wlxmlTag, wlxmlClass) {
            if(window.getSelection().isCollapsed) {
                sandbox.getModule('documentCanvas').insertNewNode(wlxmlTag, wlxmlClass);
            } else {
                sandbox.getModule('documentCanvas').wrapSelectionWithNewNode(wlxmlTag, wlxmlClass);
            }
        }
    };
    
    eventHandlers.nodeBreadCrumbs = {
        ready: function() {
            views.visualEditing.setView('statusBar', sandbox.getModule('nodeBreadCrumbs').getView());
        },
        nodeHighlighted: function(wlxmlNode) {
            commands.highlightDocumentNode(wlxmlNode, 'nodeBreadCrumbs');
        },
        nodeDimmed: function(wlxmlNode) {
            commands.dimDocumentNode(wlxmlNode, 'nodeBreadCrumbs');
        },
        nodeSelected: function(wlxmlNode) {
            commands.selectNode(wlxmlNode);
        }        
    }
    
    /* api */
    
    return {
        start: function() {
            sandbox.getModule('data').start();
        },
        handleEvent: function(moduleName, eventName, args) {
            if('')
                wysiwigHandler.handleEvent(moduleName, eventName, args);
            else if(eventHandlers[moduleName] && eventHandlers[moduleName][eventName]) {
                eventHandlers[moduleName][eventName].apply(eventHandlers, args);
            }
        }
    }
};

});