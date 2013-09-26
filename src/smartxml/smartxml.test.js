define([
    'libs/chai',
    './smartxml.js'
], function(chai, smartxml) {
    
'use strict';


var expect = chai.expect;


describe.only('Basic use', function() {
    it('exposes root element', function() {
        var doc = smartxml.fromXML('<div></div>');
        expect(doc.root.getTagName()).to.equal('div');
    });
});

});