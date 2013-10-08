define([
    'libs/chai',
    './wlxml.js'
], function(chai, wlxml) {
    
'use strict';

/* global it, describe */

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
            expect(node.getMetaAttributes()).to.eql([{name: 'attr1', value: 'val1'}, {name: 'attr2', value: 'val2'}]);
        });

        it('returns attributes other than class and meta-* as other attributes', function() {
            var node = nodeFromXML('<span class="uri" meta-attr="val" attr1="val1" attr2="val2"></span>');
            expect(node.getOtherAttributes()).to.eql({attr1: 'val1', attr2: 'val2'});
        });
    });

    describe('White space handling', function() {
        it('ignores white space surrounding block elements', function() {
            var node = nodeFromXML('<section> <div></div> </section>'),
                contents = node.contents();
            expect(contents).to.have.length(1);
            expect(contents[0].nodeType).to.equal(Node.ELEMENT_NODE);
        });
        it('ignores white space between block elements', function() {
            var node = nodeFromXML('<section><div></div> <div></div></section>'),
            contents = node.contents();
            expect(contents).to.have.length(2);
            [0,1].forEach(function(idx) {
                expect(contents[idx].nodeType).to.equal(Node.ELEMENT_NODE);
            });
        });
        it('trims white space from the beginning and the end of the block elements', function() {
            var node = nodeFromXML('<section> Alice <span>has</span> a cat </section>');
            expect(node.contents()[0].getText()).to.equal('Alice ');
            expect(node.contents()[2].getText()).to.equal(' a cat');
        });
        it('normalizes string of white characters to one space at the inline element boundries', function() {
            var node = nodeFromXML('<span>   Alice has a cat   </span>');
            expect(node.contents()[0].getText()).to.equal(' Alice has a cat ');
        });
        it('normalizes string of white characters to one space before inline element', function() {
            var node = nodeFromXML('<div>Alice has  <span>a cat</span></div>');
            expect(node.contents()[0].getText()).to.equal('Alice has ');
        });
        it('normalizes string of white characters to one space after inline element', function() {
            var node = nodeFromXML('<div>Alice has <span>a</span>  cat</div>');
            expect(node.contents()[2].getText()).to.equal(' cat');
        });
    });

});

});