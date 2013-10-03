define([
    'libs/chai',
    './wlxml.js'
], function(chai, wlxml) {
    
'use strict';

var expect = chai.expect;

var nodeFromXML = function(xml) {
    return wlxml.WLXMLElementNodeFromXML(xml);
};


describe('WLXMLDocument', function() {
    
    describe('Basic wlxml element node properties', function() {
        it('returns its class', function() {
            var node = nodeFromXML('<header class="class.subclass"></header>');
            expect(node.getClass()).to.equal('class.subclass');
        });
    });
});

});