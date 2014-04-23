define(function(require) {
    
'use strict';
/* global describe, it */
/* jshint expr:true */


var chai = require('libs/chai'),
    smartxml = require('./smartxml.js');


var expect = chai.expect;

var getDocumentFromXML = function(xml) {
    return smartxml.documentFromXML(xml);
};

describe('Fragments API', function() {
    describe('node fragment', function() {
        it('describes a single node', function() {
            var doc = getDocumentFromXML('<section></section');

            var fragment = doc.createFragment(doc.NodeFragment, {node:doc.root});
            expect(fragment instanceof fragment.NodeFragment).to.be.true;
            expect(fragment.node.sameNode(doc.root)).to.be.true;
        });
    });

    describe('caret fragment', function() {
        it('describes place in a text', function() {
            var doc = getDocumentFromXML('<section>Alice</section>');

            var fragment = doc.createFragment(doc.CaretFragment, {node: doc.root.contents()[0], offset: 1});

            expect(fragment instanceof fragment.CaretFragment).to.be.true;
            expect(fragment instanceof fragment.NodeFragment).to.be.true;
            expect(fragment.node.getText()).to.equal('Alice');
            expect(fragment.offset).to.equal(1);
        });
    });

    describe('text range fragment', function() {
        it('describes fragment of a text node', function() {
            var doc = getDocumentFromXML('<section>Alice</section>'),
                textNode = doc.root.contents()[0];

            var fragment = doc.createFragment(doc.TextRangeFragment, {
                node1: textNode,
                offset1: 4,
                node2: textNode,
                offset2: 1
            });

            expect(fragment instanceof fragment.TextRangeFragment).to.be.true;
            expect(fragment instanceof fragment.RangeFragment).to.be.true;
            expect(fragment.startNode.getText()).to.equal('Alice');
            expect(fragment.startOffset).to.equal(1);
            expect(fragment.endNode.getText()).to.equal('Alice');
            expect(fragment.endOffset).to.equal(4);
        });
        it('describes text spanning multiple nodes', function() {
            var doc = getDocumentFromXML('<section>Alice <span>has</span> a cat!</section>'),
                textNode1 = doc.root.contents()[0],
                textNode2 = doc.root.contents()[2];

            var fragment = doc.createFragment(doc.TextRangeFragment, {
                node1: textNode2,
                offset1: 4,
                node2: textNode1,
                offset2: 1
            });

            expect(fragment instanceof fragment.TextRangeFragment).to.be.true;
            expect(fragment.startNode.getText()).to.equal('Alice ');
            expect(fragment.startOffset).to.equal(1);
            expect(fragment.endNode.getText()).to.equal(' a cat!');
            expect(fragment.endOffset).to.equal(4);
        });
    });
});

});