define([
    'libs/chai',
    './wlxml.js'
], function(chai, wlxml) {
    
'use strict';

var expect = chai.expect;


describe('how it works', function() {
    it('does something', function() {
        var doc = wlxml.WLXMLDocumentFromXML('<section class="class.subclass"></section>');
        expect(doc.root.getClass()).to.equal('class.subclass');
    });
});

});