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

        it('returns its attributes as dict', function() {
            var node = nodeFromXML('<span meta-attr1="val1" meta-attr2="val2"></span>');
            expect(node.getMetaAttributes()).to.eql({attr1: 'val1', attr2: 'val2'});
        });

        it('returns attributes other than class and meta-* as other attributes', function() {
            var node = nodeFromXML('<span class="uri" meta-attr="val" attr1="val1" attr2="val2"></span>');
            expect(node.getOtherAttributes()).to.eql({attr1: 'val1', attr2: 'val2'});
        });
    });

});

});