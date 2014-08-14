define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    keyboard = require('modules/documentCanvas/canvas/keyboard');

var KEYS = keyboard.KEYS;

var KeyEvent = function(params) {
    this.key = params.key;
    this.ctrlKey = params.ctrlKey;
    this._nativeEvent = params._nativeEvent;
};

_.extend(KeyEvent.prototype, KEYS, {
    forKey: function(k) {
        return k === this.key;
    },
    preventDefault: function() {
        if(this._nativeEvent) {
            this._nativeEvent.preventDefault();
        }
    }
});

return {
    fromParams: function(params) {
        return new KeyEvent(params);
    },
    fromNativeEvent: function(e) {
        return this.fromParams({
            key: e.which,
            ctrlKey: e.ctrlKey,
            _nativeEvent: e
        });
    }
};

});