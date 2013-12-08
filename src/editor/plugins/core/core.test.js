define(function(require) {
    
'use strict';
/* globals describe, it */

var chai = require('libs/chai'),
    wlxml = require('wlxml/wlxml'),
    corePlugin = require('./core.js'),
    expect = chai.expect;

var getDocumentFromXML = function(xml, options) {
    var doc = wlxml.WLXMLDocumentFromXML(xml, options || {});
    doc.registerExtension(corePlugin.documentExtension);
    return doc;
};


describe('Document extensions', function() {
    describe('break content', function() {
        it('break text into two nodes', function() {
            var doc = getDocumentFromXML('<section><div>Alice</div></section>'),
                textNode = doc.root.contents()[0].contents()[0];
            
            var result = textNode.breakContent({offset:3});

            var section = doc.root;
            expect(section.contents().length).to.equal(2);
            expect(section.contents()[0].contents()[0].getText()).to.equal('Ali');
            expect(section.contents()[1].contents()[0].getText()).to.equal('ce');

            expect(result.first.sameNode(section.contents()[0])).to.equal(true);
            expect(result.second.sameNode(section.contents()[1])).to.equal(true);
            expect(result.emptyText).to.equal(undefined, 'no new text node created');
        });
        it('puts empty text node when breaking at the very beginning', function() {
            var doc = getDocumentFromXML('<section><div>Alice</div></section>'),
                textNode = doc.root.contents()[0].contents()[0];
            
            var result = textNode.breakContent({offset:0}),
                firstNode = doc.root.contents()[0];

            expect(result.emptyText.sameNode(firstNode.contents()[0]));
            expect(result.emptyText.getText()).to.equal('');
        });
        it('puts empty text node when breaking at the very end', function() {
            var doc = getDocumentFromXML('<section><div>Alice</div></section>'),
            textNode = doc.root.contents()[0].contents()[0];
            
            var result = textNode.breakContent({offset:5}),
                secondNode = doc.root.contents()[1];
            
            expect(result.emptyText.sameNode(secondNode.contents()[0]));
            expect(result.emptyText.getText()).to.equal('');
        });
    });
});


});