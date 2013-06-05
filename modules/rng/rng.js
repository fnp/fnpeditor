define([
'fnpjs/layout',
'fnpjs/vbox',
'views/tabs/tabs',
'libs/text!./mainLayout.html',
'libs/text!./editingLayout.html',
], function(layout, vbox, tabs, mainLayoutTemplate, editingLayoutTemplate) {

return function(sandbox) {
    'use strict';
    
    var mainTabs = (new tabs.View()).render();
    var mainLayout = new layout.Layout(mainLayoutTemplate);
    var editingLayout = new layout.Layout(editingLayoutTemplate);
    
    sandbox.getDOM().append(mainLayout.getAsView());
    
    function addTab(title, slug, view) {
        mainTabs.addTab(title, slug, view);
    }
    
    /* Events handling */
    
    var eventHandlers = {};
     
    eventHandlers.sourceEditor = {
        ready: function() {
            addTab(gettext('Source'), 'source',  sandbox.getModule('sourceEditor').getView());
            sandbox.getModule('sourceEditor').setDocument(sandbox.getModule('data').getDocument());
        }
    };
    
    eventHandlers.visualEditor = {
        ready: function() {
            sandbox.getModule('visualEditor').setDocument(sandbox.getModule('data').getDocument());
            addTab(gettext('Visual'), 'visual', sandbox.getModule('visualEditor').getView());
            
        }
    };
    
    eventHandlers.data = {
        ready: function() {
            mainLayout.setView('mainView', mainTabs.getAsView());
            
            _.each(['visualEditor', 'sourceEditor', 'documentCanvas', 'nodePane', 'metadataEditor', 'nodeFamilyTree', 'mainBar', 'indicator'], function(moduleName) {
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
           addTab('rng2 test', 'rng2test', sandbox.getModule('rng2').getView());
           
        }
    }
    
    eventHandlers.mainBar = {
        ready: function() {
            mainLayout.setView('topPanel', sandbox.getModule('mainBar').getView());
        },
        'cmd.save': function() {
            sandbox.getModule('data').fakeSave();
        }
    }
    
    eventHandlers.indicator = {
        ready: function() {
            mainLayout.setView('messages', sandbox.getModule('indicator').getView());
        }
    };
    
    
    var sidebar = (new tabs.View({stacked: true})).render();
    var box = new vbox.VBox();
    editingLayout.setView('rightColumn', sidebar.getAsView());
    addTab('rng2 test', 'rng2test', editingLayout.getAsView());
    
    eventHandlers.documentCanvas = {
        ready: function() {
            sandbox.getModule('documentCanvas').setDocument(sandbox.getModule('data').getDocument());
            editingLayout.setView('leftColumn', sandbox.getModule('documentCanvas').getView());
        },
        
        nodeSelected: function(node) {
            sandbox.getModule('nodePane').setNode(node);
            sandbox.getModule('nodeFamilyTree').setNode(node);
        },
        
        contentChanged: function() {
        
        },
        
        nodeHovered: function(node) {
            
        },
        
        nodeBlured: function(node) {
        
        }
    };

    eventHandlers.nodePane = {
        ready: function() {
            //sidebar.addTab({icon: 'pencil'}, 'nodePane', sandbox.getModule('nodePane').getView());
            box.appendView(sandbox.getModule('nodePane').getView());
            sidebar.addTab({icon: 'pencil'}, 'edit', box.getAsView());
        },
        
        nodeChanged: function(attr, value) {
            sandbox.getModule('documentCanvas').modifyCurrentNode(attr, value);
        }
    };
    
    eventHandlers.metadataEditor = {
        ready: function() {
            sandbox.getModule('metadataEditor').setMetadata(sandbox.getModule('data').getDocument());
            sidebar.addTab({icon: 'info-sign'}, 'metadataEditor', sandbox.getModule('metadataEditor').getView());
        }
    };
    
    eventHandlers.nodeFamilyTree = {
        ready: function() {
            //sidebar.addTab({icon: 'home'}, 'family', sandbox.getModule('nodeFamilyTree').getView());
            box.appendView(sandbox.getModule('nodeFamilyTree').getView());
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