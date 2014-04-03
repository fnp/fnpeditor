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
            prototype = Object.create({});

        register.register({
            tag: 'div',
            prototype: prototype,
        });
        var Element = register.getElement({tag: 'div'});
        expect(Element.prototype).to.equal(prototype);
    });
    it('registers element for a class', function() {
        var register = new ElementsRegister(documentElement.DocumentNodeElement),
            prototype = Object.create({});

        register.register({
            tag: 'div',
            klass: 'a.b',
            prototype: prototype,
        });
        var Element = register.getElement({tag: 'div', klass: 'a.b.c'});
        expect(Element.prototype).to.equal(prototype);
    });
});


});
