define(['libs/jquery', 'libs/underscore', 'fnpjs/logging/logging'], function($, _, logging) {

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
        config;
        
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
        
        this.getTemplate = function(templateName) {
            return _.template($('[data-template-name="' + moduleName + '.' + templateName + '"]').html().trim());
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
    };
    
    
    this.setBootstrappedData = function(moduleName, data) {
        bootstrappedData[moduleName] = data;
    };

    this.registerPlugin = function(plugin) {
        plugins.push(plugin);
    };
    
    this.start = function(_config) {
        config = _.extend({
            rootSelector: 'body'
        }, _config);


        if(config.logging) {
            logging.setConfig(config.logging);
        }

        app.initModules.forEach(function(moduleName) {
            getModuleInstance(moduleName).start();
        });
    };
};

return {
    Runner: Runner
};

});