define(function(require) {
    
'use strict';
/* globals describe, it */

var chai = require('libs/chai'),
    sinon = require('libs/sinon'),
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

    describe('mergin text with preceding content', function() {
        it('does nothing if text node parent has no preceding element', function() {
            var doc = getDocumentFromXML('<section><div><div>some text</div></div></section>'),
                text = getTextNode('some text', doc),
                spy = sinon.spy();

            doc.on('change', spy);
            text.mergeContentUp();
            expect(spy.callCount).to.equal(0);
        });
        it('does nothing if text node parent is precedeed by text node', function() {
            var doc = getDocumentFromXML('<section><div></div>another text<div>some text</div></section>'),
                text = getTextNode('some text', doc),
                spy = sinon.spy();

            doc.on('change', spy);
            text.mergeContentUp();
            expect(spy.callCount).to.equal(0);
        });
        it('does nothing if text node is not first child of its parent', function() {
            var doc = getDocumentFromXML('<section><div></div><div><a></a>some text</div></section>'),
                text = getTextNode('some text', doc),
                spy = sinon.spy();

            doc.on('change', spy);
            text.mergeContentUp();
            expect(spy.callCount).to.equal(0);
        });
        it('moves text node and its siblings to the block element preceding text node parent', function() {
            var doc = getDocumentFromXML('<section><div></div><div>some text<span>is</span> here!</div></section>'),
                text = getTextNode('some text', doc);
            
            text.mergeContentUp();
            
            var contents = doc.root.contents();
            expect(contents.length).to.equal(1);
            expect(contents[0].contents().length).to.equal(3);
            expect(contents[0].contents()[0].getText()).to.equal('some text');
            expect(contents[0].contents()[1].getTagName()).to.equal('span');
            expect(contents[0].contents()[2].getText()).to.equal(' here!');
        });
    });
});


});