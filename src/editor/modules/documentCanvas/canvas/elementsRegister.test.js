define(function(require) {
    
'use strict';
/* globals describe, it */


var ElementsRegister = require('./elementsRegister.js'),
    documentElement = require('./documentElement.js'),
    chai = require('libs/chai');

var expect = chai.expect;

describe('Elements register', function() {
    it('registers element for a tag', function() {
        var register = new ElementsRegister(documentElement.DocumentNodeElement),
            prototype = {testMethod: function(){}};

        register.register({
            tag: 'div',
            prototype: prototype,
        });

        var Element = register.getElement({tag: 'div'});
        expect(Element.prototype.testMethod).to.equal(prototype.testMethod, '1');
        expect(Element.prototype instanceof documentElement.DocumentNodeElement).to.equal(true, '2');
    });
    it('registers element for a class', function() {
        var register = new ElementsRegister(documentElement.DocumentNodeElement),
            prototype = {testMethod: function(){}};

        register.register({
            tag: 'div',
            klass: 'a.b',
            prototype: prototype,
        });
        var Element = register.getElement({tag: 'div', klass: 'a.b.c'});
        expect(Element.prototype.testMethod).to.equal(prototype.testMethod, '1');
        expect(Element.prototype instanceof documentElement.DocumentNodeElement).to.equal(true, '2');
    });
    it('allows inheriting from selected element', function() {
        var register = new ElementsRegister(documentElement.DocumentNodeElement),
            method1 = function() {},
            method2 = function() {};

        register.register({
            tag: 'div',
            prototype: {method1: method1}
        });

        register.register({
            tag: 'div',
            klass: 'a',
            prototype: {method2: method2},
            extending: {tag: 'div'}
        });

        var Element = register.getElement({tag: 'div', klass: 'a'});
        expect(Element.prototype.method2).to.equal(method2, '2');
        expect(Element.prototype instanceof register.getElement({tag: 'div'})).to.equal(true, '2');
    });
});


});
