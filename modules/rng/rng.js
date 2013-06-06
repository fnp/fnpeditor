define([
'fnpjs/layout',
'fnpjs/vbox',
'views/tabs/tabs',
'libs/text!./mainLayout.html',
'libs/text!./editingLayout.html',
], function(layout, vbox, tabs, mainLayoutTemplate, visualEditingLayoutTemplate) {

return function(sandbox) {
    'use strict';
    
    function addMainTab(title, slug, view) {
        views.mainTabs.addTab(title, slug, view);
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
    
    

    
    /* Events handling */
    
    var eventHandlers = {};
     
    eventHandlers.sourceEditor = {
        ready: function() {
            addMainTab(gettext('Source'), 'source',  sandbox.getModule('sourceEditor').getView());
            sandbox.getModule('sourceEditor').setDocument(sandbox.getModule('data').getDocument());
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
            var slug = (reason === 'visual_edit' ? 'source' : 'visual');
            sandbox.getModule(slug+'Editor').setDocument(document);
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
    
    eventHandlers.rng2 = {
        ready: function() {
           addMainTab('rng2 test', 'rng2test', sandbox.getModule('rng2').getView());
           
        }
    }
    
    eventHandlers.mainBar = {
        ready: function() {
            views.mainLayout.setView('topPanel', sandbox.getModule('mainBar').getView());
        },
        'cmd.save': function() {
            sandbox.getModule('data').fakeSave();
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
        
        nodeSelected: function(node) {
            sandbox.getModule('nodePane').setNode(node);
            sandbox.getModule('nodeFamilyTree').setNode(node);
            sandbox.getModule('nodeBreadCrumbs').setNode(node);
        },
        
        contentChanged: function() {
        
        },
        
        nodeHovered: function(node) {
            sandbox.getModule('documentCanvas').highlightNode(node.attr('id'));
            sandbox.getModule('nodeFamilyTree').highlightNode(node.attr('id'));
            sandbox.getModule('nodeBreadCrumbs').highlightNode(node.attr('id'));
            
        },
        
        nodeBlured: function(node) {
            sandbox.getModule('documentCanvas').dimNode(node.attr('id'));
            sandbox.getModule('nodeFamilyTree').dimNode(node.attr('id'));
            sandbox.getModule('nodeBreadCrumbs').dimNode(node.attr('id'));
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
            sandbox.getModule('metadataEditor').setMetadata(sandbox.getModule('data').getDocument());
            views.visualEditingSidebar.addTab({icon: 'info-sign'}, 'metadataEditor', sandbox.getModule('metadataEditor').getView());
        }
    };
    
    eventHandlers.nodeFamilyTree = {
        ready: function() {
            views.currentNodePaneLayout.appendView(sandbox.getModule('nodeFamilyTree').getView());
        },
        nodeEntered: function(id) {
            sandbox.getModule('documentCanvas').highlightNode(id);
        },
        nodeLeft: function(id) {
            sandbox.getModule('documentCanvas').dimNode(id);
        },
        nodeSelected: function(id) {
            sandbox.getModule('documentCanvas').selectNode(id);
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
        nodeHighlighted: function(id) {
            sandbox.getModule('documentCanvas').highlightNode(id);
        },
        nodeDimmed: function(id) {
            sandbox.getModule('documentCanvas').dimNode(id);
        },
        nodeSelected: function(id) {
            sandbox.getModule('documentCanvas').selectNode(id);
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