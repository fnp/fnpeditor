define(function(require) {
    
'use strict';
var _ = require('libs/underscore'),
    wlxml = require('wlxml/wlxml');


var ElementsRegister = function(basePrototype, defaultPrototype) {
    this._register = {};
    this.basePrototype = basePrototype;
    this.DefaultType = this.createCanvasElementType(defaultPrototype);
};

_.extend(ElementsRegister.prototype, {
    createCanvasElementType: function(elementPrototype, extending) {
        var inheritFrom = this.basePrototype;
        if(extending && extending.tag) {
            inheritFrom = this.getElement(extending);
        }
        var Constructor = function() {
            if(!this.super) {
                this.super = inheritFrom.prototype;
            }
            inheritFrom.apply(this, Array.prototype.slice.call(arguments, 0));
            
        };
        Constructor.prototype = Object.create(inheritFrom.prototype);
        _.extend(Constructor.prototype, elementPrototype);
        return Constructor;
    },
    register: function(params) {
        params.klass = params.klass || '';
        params.prototype = params.prototype || Object.create({});

        this._register[params.tag] = this._register[params.tag] || {};
        this._register[params.tag][params.klass] = this.createCanvasElementType(params.prototype, params.extending);
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
            Factory = this.DefaultType;
        }
        return Factory;
    }
});


return ElementsRegister;

});
