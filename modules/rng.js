define(['views/tabs/tabs'], function(tabs) {

return function(sandbox) {
    'use strict';
    
    var mainTabs = (new tabs.View()).render();
    
    function addTab(title, slug, view) {
        mainTabs.addTab(title, slug, view);
    }
    
    /* Events handling */
    
    var eventHandlers = {};
    
    eventHandlers.skelton = {
        ready: function() {
            sandbox.getModule('skelton').setMainView(mainTabs.getAsView());
            
            _.each(['visualEditor', 'sourceEditor', 'rng2'], function(moduleName) {
                sandbox.getModule(moduleName).start();
            });
        },
        'cmd.save': function() {
            //todo
        }
    };
     
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
            sandbox.getModule('skelton').start();
        },
        documentChanged: function(document, reason) {
            var slug = (reason === 'visual_edit' ? 'source' : 'visual');
            sandbox.getModule(slug+'Editor').setDocument(document);
        },
        savingStarted: function() {
            sandbox.getModule('skelton').deactivateCommand('save');
            sandbox.getModule('skelton').showMessage(gettext('Saving...'));
        },
        savingEnded: function(status) {
            sandbox.getModule('skelton').activateCommand('save');
            sandbox.getModule('skelton').clearMessage();
        }
    }
    
    eventHandlers.rng2 = {
        ready: function() {
           addTab('rng2 test', 'rng2test', sandbox.getModule('rng2').getView());
           
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