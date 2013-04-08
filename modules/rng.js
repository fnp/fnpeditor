rng.modules.rng = function(sandbox) {

    function addTab(title, slug, view) {
        sandbox.getModule('tabsManager').addTab(title, slug, view);
    }
    
    /* Events handling */
    
    eventHandlers = {};
    
    eventHandlers.skelton = {
        ready: function() {
            sandbox.getModule('tabsManager').start();
        }
    };
    
    eventHandlers.tabsManager = {
        ready: function() {
            sandbox.getModule('skelton').setMainView(sandbox.getModule('tabsManager').getView());
            _.each(['sourceEditor', 'visualEditor'], function(moduleName) {
                sandbox.getModule(moduleName).start();
            });
        }
    };
    
    eventHandlers.sourceEditor = {
        ready: function() {
            addTab('Source', 'source',  sandbox.getModule('sourceEditor').getView());
        }
    };
    
    eventHandlers.visualEditor = {
        ready: function() {
            addTab('Visual', 'visual', sandbox.getModule('visualEditor').getView());
        }
    };
    
    
    /* api */
    
    return {
        start: function() {
            sandbox.getModule('skelton').start();
        },
        handleEvent: function(moduleName, eventName, args) {
            if(eventHandlers[moduleName] && eventHandlers[moduleName][eventName]) {
                eventHandlers[moduleName][eventName].apply(eventHandlers, args);
            }
        }
    }
};