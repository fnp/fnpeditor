define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    handlers = require('fnpjs/logging/handlers'),
    config = {},
    levels = ['debug', 'info', 'warning', 'error', 'critical'];


var Logger = function(name) {
    this.name = name;
    Object.defineProperty(this, 'config', {
        get: function() {
            return _.extend({
                propagate: true,
                level: 'warn',
                handlers: []
            }, config.loggers[name] || {});
        }
    });
};

_.extend(Logger.prototype, {
    log: function(level, message, data) {
        if(levels.indexOf(level) !== -1 && levels.indexOf(level) >= levels.indexOf(this.config.level)) {
            this.config.handlers.forEach(function(handlerName) {
                var handlerConfig = config.handlers[handlerName],
                    handler = handlerConfig.handler,
                    handlerLevel = handlerConfig.level || 'info';

                if(typeof handler === 'string') {
                    handler = handlers[handlerConfig.handler];
                }
                if(!handler) {
                    throw new Error('Unknown handler: ' + handlerName);
                }

                if(levels.indexOf(handlerLevel) !== -1 && levels.indexOf(level) >= levels.indexOf(handlerLevel)) {
                    handler({
                        message: message,
                        level: level,
                        loggerName: this.name,
                        data: data
                    });
                }
            }.bind(this));
        }
        if(this.config.propagate && this.name) {
            var logger = new Logger(this.name.split('.').slice(0, -1).join('.'));
            logger.log(level, message, data);
        }
    },
    exception: function(e) {
        this.log('error', e.toString(), {exception: e});
    }
});

levels.forEach(function(level) {
    Logger.prototype[level] = function(message, data) {
        return this.log(level, message, data);
    };
});


var api = {
    getLogger: function(name) {
        return new Logger(name);
    },
    setConfig: function(_config) {
        config = _.extend({
            handlers: [],
            loggers: []
        } ,_config);
    },
    clearConfig: function() {
        this.setConfig({});
    }
};

api.clearConfig();


return api;

});
