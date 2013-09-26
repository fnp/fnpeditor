define([
    'libs/chai',
    './smartxml.js'
], function(chai, smartxml) {
    
'use strict';


var expect = chai.expect;


var getDocumentFromXML = function(xml) {
    return smartxml.documentFromXML(xml);
}

var elementNodeFromParams = function(params) {
    return smartxml.elementNodeFromXML('<' + params.tag + '></' + params.tag + '>');
}


describe.only('smartxml', function() {

    describe('Basic use', function() {
        it('exposes root element', function() {
            var doc = getDocumentFromXML('<div></div>');
            expect(doc.root.getTagName()).to.equal('div');
        });
    });

    describe('Manipulations', function() {

        it('appende element node to another element node', function() {
            var node1 = elementNodeFromParams({tag: 'div'}),
                node2 = elementNodeFromParams({tag: 'a'});
            node1.append(node2);
            expect(node1.contents()[0].sameNode(node2)).to.be.true;
        });

    });

});

});