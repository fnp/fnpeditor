rng.modules.rng = function(sandbox) {

    function addTab(title, slug, view) {
        sandbox.getModule('tabsManager').addTab(title, slug, view);
    }
    
    /* Events handling */
    
    eventHandlers = {};
    
    eventHandlers.skelton = {
        ready: function() {
            sandbox.getModule('tabsManager').start();
        },
        'cmd.save': function() {
            var editorSlugs = ['visual', 'source'];
            var slug = sandbox.getModule('tabsManager').getCurrentSlug();
            if(_.contains(editorSlugs, slug)) {
                var editor = sandbox.getModule(slug+'Editor');
                if(editor.isDirty()) {
                    sandbox.getModule('data').commitDocument(editor.getDocument(), slug + '_edit');
                    editor.setDirty(false);
                }
            }
            sandbox.getModule('data').saveDocument();
        }
    };
    
    eventHandlers.tabsManager = {
        ready: function() {
            sandbox.getModule('skelton').setMainView(sandbox.getModule('tabsManager').getView());
            _.each(['visualEditor', 'sourceEditor'], function(moduleName) {
                sandbox.getModule(moduleName).start();
            });
        },
        leaving: function(slug) {
            if(slug === 'source' || slug === 'visual') {
                var editor = sandbox.getModule(slug+'Editor');
                if(editor.isDirty()) {
                    sandbox.getModule('data').commitDocument(editor.getDocument(), slug + '_edit');
                    editor.setDirty(false);
                }
            }
        },
        showed: function(slug) {
            if(slug === 'visual')
                sandbox.getModule('visualEditor').onShowed();
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
        }
    }
    
    
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
    }
};