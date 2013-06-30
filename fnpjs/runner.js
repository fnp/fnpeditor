define(['libs/jquery-1.9.1.min', 'libs/underscore-min'], function($, _) {

var Runner = function(app, modules) {

    function getModuleInstance(moduleName) {
        var module = moduleInstances[moduleName] = (moduleInstances[moduleName] || modules[moduleName](new Sandbox(moduleName)));
        return module;
    }

    var bootstrappedData = {},
        options = {},
        moduleInstances = {},
        eventListeners = [];
        
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
            console.log(moduleName + ': ' + eventName);
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
            return $(options.rootSelector);
        } : undefined;
        
    };
    
    
    this.setBootstrappedData = function(moduleName, data) {
        bootstrappedData[moduleName] = data;
    };
    
    this.start = function(_options) {
        options = _.extend({
            rootSelector: 'body'
        }, _options);
        app.initModules.forEach(function(moduleName) {
            getModuleInstance(moduleName).start();
        });
    };
};

return {
    Runner: Runner
};

});