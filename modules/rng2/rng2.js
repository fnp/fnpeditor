define([
'fnpjs/layout',
'fnpjs/vbox',
'views/tabs/tabs',
'libs/text!./layout.html',
],
function(layout, vbox, tabs, layoutTemplate) {

'use strict';

return function(sandbox) {    
    var view = new layout.Layout(layoutTemplate);
    
    var sidebar = new tabs.View({stacked: true});
    sidebar.render();
    
    var box = new vbox.VBox();
    
    
    view.setView('rightColumn', sidebar.$el);
    
    var eventHandlers = {};
    
    eventHandlers.documentCanvas = {
        ready: function() {
            sandbox.getModule('documentCanvas').setDocument(sandbox.getModule('data').getDocument());
            view.setView('leftColumn', sandbox.getModule('documentCanvas').getView());
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
    
    
    
    return {
        start: function() {
            sandbox.getModule('documentCanvas').start();
            sandbox.getModule('nodePane').start();
            sandbox.getModule('metadataEditor').start();
            sandbox.getModule('nodeFamilyTree').start();
            
            sandbox.publish('ready');
        },
        handleEvent: function(moduleName, eventName, args) {
            if(eventHandlers[moduleName] && eventHandlers[moduleName][eventName]) {
                eventHandlers[moduleName][eventName].apply(eventHandlers, args);
            }
        },
        getView: function() { return view.getAsView(); }
        
    }
}

});