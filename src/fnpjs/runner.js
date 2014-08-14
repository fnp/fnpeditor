define(['libs/jquery', 'libs/underscore', 'fnpjs/logging/logging', 'fnpjs/actions'], function($, _, logging, actions) {

'use strict';

var Runner = function(app, modules) {

    function getModuleInstance(moduleName) {
        var module = moduleInstances[moduleName] = (moduleInstances[moduleName] || modules[moduleName](new Sandbox(moduleName)));
        return module;
    }

    var bootstrappedData = {},
        moduleInstances = {},
        eventListeners = [],
        plugins = [],
        actionDefinitions = {},
        config,
        actionsAppObject,
        currentContextMenu;
        
    _.each(_.keys(modules || {}), function(moduleName) {
        if(_.contains(app.permissions[moduleName] || [], 'handleEvents')) {
            eventListeners.push(moduleName);
        }
    });

    
        
    var Sandbox = function(moduleName) {
        this.$ = $;
        this._ = _;
        
        this.getBootstrappedData = function() {
            return bootstrappedData[moduleName];
        };
        
        this.publish = function(eventName) {
            var eventArgs = Array.prototype.slice.call(arguments, 1);
            _.each(eventListeners, function(listenerModuleName) {
                var listener = moduleInstances[listenerModuleName];
                if(listener) {
                    listener.handleEvent(moduleName, eventName, eventArgs);
                }
            });
        };
        
        var permissions = app.permissions[moduleName];
        
        this.getModule = _.contains(permissions, 'getModule') ? function(requestedModuleName) {
            return getModuleInstance(requestedModuleName);
        } : undefined;
        
        this.getDOM = _.contains(permissions, 'getDOM') ? function() {
            return $(config.rootSelector);
        } : undefined;

        this.getPlugins = function() {
            return plugins;
        };

        this.getConfig = function() {
            return config;
        };

        this.createAction = function(fqName, config) {
            var definition = actionDefinitions[fqName];
            if(!definition) {
                throw new Error('Invalid action: ' + fqName);
            }
            return new actions.Action(fqName, definition, config, actionsAppObject);
        };

        this.registerKeyHandler = function(eventName, handler) {
            $('body').on(eventName, function(e) {
                handler(e);
            });
        };

        this.registerActionsAppObject = function(_actionsAppObject) {
            actionsAppObject = _actionsAppObject;
        };

        this.showContextMenu = function(menu, coors) {
            if(currentContextMenu) {
                currentContextMenu.close();
            }
            currentContextMenu = menu;
            $(config.rootSelector).append(menu.dom);
            menu.dom.css({top: coors.y, left: coors.x});
            menu.show();
        };
    };
      
    this.setBootstrappedData = function(moduleName, data) {
        bootstrappedData[moduleName] = data;
    };

    this.registerPlugin = function(plugin) {
        plugins.push(plugin);
        (plugin.actions || []).forEach(function(definition) {
            var actionFqName = plugin.name + '.' + definition.name;
            actionDefinitions[actionFqName] = definition;
        });
    };
    
    this.start = function(_config) {
        config = _.extend({
            rootSelector: 'body'
        }, _config);


        if(config.logging) {
            logging.setConfig(config.logging);
        }

        _.pairs(config.plugins || {}).forEach(function(pair) {
            var pluginName = pair[0],
                pluginConfig = pair[1];

            plugins.some(function(plugin) {
                if(plugin.name === pluginName) {
                    if(_.isFunction(plugin.config)) {
                        plugin.config(pluginConfig);
                    }
                    return true; //break
                }
            });
        });

        app.initModules.forEach(function(moduleName) {
            getModuleInstance(moduleName).start();
        });

        $(config.rootSelector)[0].addEventListener('click', function(e) {
            if(currentContextMenu && !currentContextMenu.dom[0].contains(e.target)) {
                currentContextMenu.close();
                currentContextMenu = null;
            }
        }, true);
    };
};

return {
    Runner: Runner
};

});