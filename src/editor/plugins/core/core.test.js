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

var getTextNodes = function(text, doc) {
    /* globals Node */
    var toret = [];
    var search = function(node) {
        node.contents().forEach(function(node) {
            if(node.nodeType === Node.TEXT_NODE) {
                if(node.getText() === text) {
                    toret.push(node);
                }
            } else {
                search(node);
            }
        });
    };
    search(doc.root);
    return toret;
};

var getTextNode = function(text, doc) {
    var nodes = getTextNodes(text, doc),
        error;
    if(nodes.length === 0) {
        error = 'Text not found';
    } else if(nodes.length > 1) {
        error = 'Text not unique';
    } else if(nodes[0].getText() !== text) {
        error = 'I was trying to cheat your test :(';
    }
    if(error) {
        throw new Error(error);
    }
    return nodes[0];
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

    describe('merging with adjacent content', function() {

            describe('when text preceded by element', function() {
                describe('when text followed by element', function() {
                    it('appends text to the preceding element, following elements stays in place', function() {
                        var doc = getDocumentFromXML('<section><a>A</a>text<b>B</b></section>'),
                            text = getTextNode('text', doc);
                        
                        text.mergeContentUp();
                        var contents = doc.root.contents();
                        
                        expect(contents.length).to.equal(2);
                        expect(contents[0].getTagName()).to.equal('a');
                        expect(contents[0].contents()[0].getText()).to.equal('Atext');
                        expect(contents[1].getTagName()).to.equal('b');
                    });
                });
                describe('when text is a last child', function() {
                    it('appends text to the preceding element', function() {
                        var doc = getDocumentFromXML('<section><a>A</a>text</section>'),
                            text = getTextNode('text', doc);
                        
                        text.mergeContentUp();
                        var contents = doc.root.contents();
                        
                        expect(contents.length).to.equal(1);
                        expect(contents[0].getTagName()).to.equal('a');
                        expect(contents[0].contents()[0].getText()).to.equal('Atext');
                    });
                });
            });

            describe('when text is a first child', function() {
                describe('when text followed by element', function() {
                    it('appends text and its siblings to the parent preceding element', function() {
                        var doc = getDocumentFromXML('<section><b>B</b><div>text<a>A</a></div></section>'),
                            text = getTextNode('text', doc);
                        
                        text.mergeContentUp();
                        var contents = doc.root.contents();
                        
                        expect(contents.length).to.equal(3);
                        expect(contents[0].getTagName()).to.equal('b');
                        expect(contents[1].getText()).to.equal('text');
                        expect(contents[2].getTagName()).to.equal('a');
                    });
                    it('appends text and its siblings after the parent preceding text', function() {
                        var doc = getDocumentFromXML('<section>B<div>text<a>A</a></div></section>'),
                            text = getTextNode('text', doc);
                        
                        text.mergeContentUp();
                        var contents = doc.root.contents();
                        
                        expect(contents.length).to.equal(2);
                        expect(contents[0].getText()).to.equal('Btext');
                        expect(contents[1].getTagName()).to.equal('a');
                    });
                });
            });
    });
});


});