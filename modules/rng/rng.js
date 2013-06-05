define([
'fnpjs/layout',
'views/tabs/tabs',
'libs/text!./mainLayout.html'
], function(layout, tabs, mainLayoutTemplate) {

return function(sandbox) {
    'use strict';
    
    var mainTabs = (new tabs.View()).render();
    var mainLayout = new layout.Layout(mainLayoutTemplate);
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
            
            _.each(['visualEditor', 'sourceEditor', 'rng2', 'mainBar', 'indicator'], function(moduleName) {
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