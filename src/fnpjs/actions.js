define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    Backbone = require('libs/backbone'),
    logging = require('fnpjs/logging/logging');

var logger = logging.getLogger('fnpjs.actions');


var Action = function(fqName, definition, config, appObject) {
    this.fqName = fqName;
    this.definition = definition;
    this.config = config;
    this._cache = null;
    this.appObject = appObject;

    this.params = {};
};

_.extend(Action.prototype, Backbone.Events, {
    getPluginName: function() {
        return this.fqName.split('.')[0];
    },
    updateParam: function(filter, value) {
        var changed = false;
        _.pairs(this.definition.params).forEach(function(pair) {
            var paramName = pair[0],
                paramDesc = pair[1];
            if(filter(paramDesc, paramName)) {
                this.params[paramName] = value;
                changed = true;
            }
        }.bind(this));
        if(changed) {
            this._cache = null;
            this.trigger('paramsChanged');
        }
    },
    updateContextParam: function(contextName, value) {
        this.updateParam(function(paramDesc) {
            return paramDesc.type === 'context' && paramDesc.name === contextName;
        }, value);
    },
    updateKeyParam: function(keyName, toggled) {
        this.updateParam(function(paramDesc) {
            return paramDesc.type === 'key' && paramDesc.key === keyName;
        }, toggled);
    },
    updateWidgetParam: function(name, value) {
        this.updateParam(function(paramDesc, paramName) {
            return !_.contains(['context', 'key'], paramDesc.type) && paramName === name;
        }, value);
    },
    getState: function() {
        var gotState;
        if(!this._cache) {
            try {
                gotState = this.definition.getState.call(this, this.params);
            } catch(e) {
                logger.exception(e);
                return;
            }
            if(typeof gotState === 'boolean') {
                gotState = {allowed: gotState};
            }
            this._cache = _.extend({}, this.definition.stateDefaults || {}, gotState);
        }
        if(this._cache === false) {
            this._cache = {allowed: false};
        }
        return this._cache;
    },
    execute: function() {
        var state = this.getState();
        
        var callback = function(ret) {
            this.trigger('actionExecuted', ret);
        }.bind(this);

        if(state.allowed) {
            return state.execute.call(this, callback, this.params, this.appObject);
        }
        throw new Error('Execution not allowed');
    }
});


return {
    Action: Action
};

});
