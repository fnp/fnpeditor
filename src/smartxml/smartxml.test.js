define([
    'libs/chai',
    './smartxml.js'
], function(chai, smartxml) {
    
'use strict';
/*jshint expr:true */

var expect = chai.expect;


var getDocumentFromXML = function(xml) {
    return smartxml.documentFromXML(xml);
};

var elementNodeFromParams = function(params) {
    return smartxml.elementNodeFromXML('<' + params.tag + '></' + params.tag + '>');
};

var elementNodeFromXML = function(xml) {
    return smartxml.elementNodeFromXML(xml);
};


describe.only('smartxml', function() {

    describe('Basic Document properties', function() {
        it('exposes its root element', function() {
            var doc = getDocumentFromXML('<div></div>');
            expect(doc.root.getTagName()).to.equal('div');
        });
    });

    describe('Basic ElementNode properties', function() {
        it('exposes node contents', function() {
            var node = elementNodeFromXML('<node>Some<node>text</node>is here</node>'),
                contents = node.contents();

            expect(contents).to.have.length(3);
            expect(contents[0].nodeType).to.equal(Node.TEXT_NODE, 'text node 1');
            expect(contents[1].nodeType).to.equal(Node.ELEMENT_NODE, 'element node 1');
            expect(contents[2].nodeType).to.equal(Node.TEXT_NODE, 'text node 2');
        });
    });

    describe('Manipulations', function() {

        it('appends element node to another element node', function() {
            var node1 = elementNodeFromParams({tag: 'div'}),
                node2 = elementNodeFromParams({tag: 'a'});
            node1.append(node2);
            expect(node1.contents()[0].sameNode(node2)).to.be.true;
        });

        it('unwraps element node contents', function() {
            var node = elementNodeFromXML('<div>Alice <div>has <span>propably</span> a cat</div>!</div>'),
                outerDiv = node.contents()[1];
            
            outerDiv.unwrapContent();

            expect(node.contents().length).to.equal(3);
            expect(node.contents()[0].getText()).to.equal('Alice has ');
            expect(node.contents()[1].getTagName()).to.equal('span');
            expect(node.contents()[2].getText()).to.equal(' a cat!');
        });

    });

});

});