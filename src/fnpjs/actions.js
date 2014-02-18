define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    Backbone = require('libs/backbone');

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
    updateContextParam: function(contextName, value) {
        var changed = false;
        _.pairs(this.definition.params).forEach(function(pair) {
            var paramName = pair[0],
                paramDesc = pair[1];
            if(paramDesc.type === 'context' && paramDesc.name === contextName) {
                 this.params[paramName] = value;
                 changed = true;
            }
        }.bind(this));
        if(changed) {
            this._cache = null;
            this.trigger('paramsChanged');
        }
    },
    updateKeyParam: function(keyName, toggled) {
        var changed = false;
        _.pairs(this.definition.params).forEach(function(pair) {
            var paramName = pair[0],
                paramDesc = pair[1];
            if(paramDesc.type === 'key' && paramDesc.key === keyName) {
                 this.params[paramName] = toggled;
                 changed = true;
            }
        }.bind(this));

        if(changed) {
            this._cache = null;
            this.trigger('paramsChanged');
        }
    },
    updateWidgetParam: function(name, value) {
        var paramDesc = this.definition.params[name];
        if(paramDesc.type === 'context' || paramDesc.type === 'key') {
            throw new Error('');
        }
        this.params[name] = value;
        this._cache = null;
        this.trigger('paramsChanged');
    },
    getState: function() {
        var gotState;
        if(!this._cache) {
            gotState = this.definition.getState.call(this, this.params);
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
        if(state.allowed) {
            return state.execute.call(this, this.params, this.appObject);
        }
        throw new Error('Execution not allowed');
    }
});


return {
    Action: Action
};

});
