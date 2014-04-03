define(function(require) {
    
'use strict';
var _ = require('libs/underscore'),
    wlxml = require('wlxml/wlxml');


var ElementsRegister = function(BaseType) {
    this._register = {};
    this.BaseType = BaseType;
};

_.extend(ElementsRegister.prototype, {
    createCanvasElementType: function(elementPrototype) {
        var register = this;
        var Constructor = function() {
            register.BaseType.apply(this, Array.prototype.slice.call(arguments, 0));
        };
        Constructor.prototype = elementPrototype;
        return Constructor;
    },
    register: function(params) {
        params.klass = params.klass || '';
        params.prototype = params.prototype || Object.create({});

        this._register[params.tag] = this._register[params.tag] || {};
        this._register[params.tag][params.klass] = this.createCanvasElementType(params.prototype);
    },
    getElement: function(params) {
        params.klass = params.klass || '';
        var Factory;
        if(this._register[params.tag]) {
            wlxml.getClassHierarchy(params.klass).reverse().some(function(klass) {
                Factory = this._register[params.tag][klass];
                if(Factory) {
                    return true;
                }
            }.bind(this));
        }
        if(!Factory) {
            Factory = this.BaseType;
        }
        return Factory;
    }
});


return ElementsRegister;

});
