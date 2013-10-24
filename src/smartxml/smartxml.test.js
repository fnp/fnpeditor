define([
    'libs/chai',
    'libs/sinon',
    './smartxml.js'
], function(chai, sinon, smartxml) {
    
'use strict';
/*jshint expr:true */
/* global describe, it, beforeEach */

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


describe('smartxml', function() {

    describe('Basic Document properties', function() {
        it('exposes its root element', function() {
            var doc = getDocumentFromXML('<div></div>');
            expect(doc.root.getTagName()).to.equal('div');
        });

        it('can resets its content entirely', function() {
            var doc = getDocumentFromXML('<div></div>');

            expect(doc.root.getTagName()).to.equal('div');

            doc.loadXML('<header></header>');
            expect(doc.root.getTagName()).to.equal('header');
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

        describe('Storing custom data', function() {
            var node;

            beforeEach(function() {
                node = elementNodeFromXML('<div></div>');
            });

            it('can append single value', function() {
                node.setData('key', 'value');
                expect(node.getData('key')).to.equal('value');
            });

            it('can overwrite the whole data', function() {
                node.setData('key1', 'value1');
                node.setData({key2: 'value2'});
                expect(node.getData('key2')).to.equal('value2');
            });

            it('can fetch the whole data at once', function() {
                node.setData({key1: 'value1', key2: 'value2'});
                expect(node.getData()).to.eql({key1: 'value1', key2: 'value2'});
            });
        });

        describe('Changing node tag', function() {

            it('can change tag name', function() {
                var node = elementNodeFromXML('<div></div>');
                node.setTag('span');
                expect(node.getTagName()).to.equal('span');
            });

            it('emits nodeTagChange event', function() {
                var node = elementNodeFromXML('<div></div>'),
                    spy = sinon.spy();

                node.document.on('change', spy);
                node.setTag('span');
                var event = spy.args[0][0];

                expect(event.type).to.equal('nodeTagChange');
                expect(event.meta.node.sameNode(node)).to.be.true;
                expect(event.meta.oldTagName).to.equal('div');
            });

            describe('Implementation specific expectations', function() {
                // DOM specifies ElementNode tag as a read-only property, so
                // changing it in a seamless way is a little bit tricky. For this reason
                // the folowing expectations are required, despite the fact that they actually are
                // motivated by implemetation details.

                it('keeps node in the document', function() {
                    var doc = getDocumentFromXML('<div><header></header></div>'),
                        header = doc.root.contents()[0];
                    header.setTag('span');
                    expect(header.parent().sameNode(doc.root)).to.be.true;
                });
                it('keeps custom data', function() {
                    var node = elementNodeFromXML('<div></div>');

                    node.setData('key', 'value');
                    node.setTag('header');
                    
                    expect(node.getTagName()).to.equal('header');
                    expect(node.getData()).to.eql({key: 'value'});
                });

                it('can change document root tag name', function() {
                    var doc = getDocumentFromXML('<div></div>');
                    doc.root.setTag('span');
                    expect(doc.root.getTagName()).to.equal('span');
                });

                it('keeps contents', function() {
                    var node = elementNodeFromXML('<div><div></div></div>');
                    node.setTag('header');
                    expect(node.contents()).to.have.length(1);
                });
            });

        describe('Setting node attributes', function() {
            it('can set node attribute', function() {
                var node = elementNodeFromXML('<div></div>');

                node.setAttr('key', 'value');
                expect(node.getAttr('key')).to.equal('value');
            });
            it('emits nodeAttrChange event', function() {
                var node = elementNodeFromXML('<div key="value1"></div>'),
                    spy = sinon.spy();

                node.document.on('change', spy);
                node.setAttr('key', 'value2');
                var event = spy.args[0][0];

                expect(event.type).to.equal('nodeAttrChange');
                expect(event.meta.node.sameNode(node)).to.be.true;
                expect(event.meta.attr).to.equal('key');
                expect(event.meta.oldVal).to.equal('value1');
            });
        });

        });
    });

    describe('Basic TextNode properties', function() {
        it('can have its text set', function() {
            var node = elementNodeFromXML('<div>Alice</div>'),
                textNode = node.contents()[0];

            textNode.setText('Cat');
            expect(textNode.getText()).to.equal('Cat');
        });

        it('emits nodeTextChange', function() {
            var node = elementNodeFromXML('<div>Alice</div>'),
                textNode = node.contents()[0],
                spy = sinon.spy();

            textNode.document.on('change', spy);
            textNode.setText('Cat');

            var event = spy.args[0][0];
            expect(event.type).to.equal('nodeTextChange');
        });
    });

    describe('Manipulations', function() {

        it('appends element node to another element node', function() {
            var node1 = elementNodeFromParams({tag: 'div'}),
                node2 = elementNodeFromParams({tag: 'a'});
            node1.append(node2);
            expect(node1.contents()[0].sameNode(node2)).to.be.true;
        });

        it('wraps element node with another element node', function() {
            var node = elementNodeFromXML('<div></div>'),
                wrapper = elementNodeFromXML('<wrapper></wrapper>');

            node.wrapWith(wrapper);
            expect(node.parent().sameNode(wrapper)).to.be.true;
        });

        it('wraps text node with element node', function() {
            var node = elementNodeFromXML('<div>Alice</div>'),
                textNode = node.contents()[0],
                wrapper = elementNodeFromXML('<wrapper></wrapper>');

            textNode.wrapWith(wrapper);
            expect(textNode.parent().sameNode(wrapper)).to.be.true;
            expect(node.contents()).to.have.length(1);
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

    describe('Serializing document to WLXML', function() {
        it('keeps document intact when no changes have been made', function() {
            var xmlIn = '<section>Alice<div>has</div>a <span class="uri" meta-uri="http://cat.com">cat</span>!</section>',
                doc = getDocumentFromXML(xmlIn),
                xmlOut = doc.toXML();

            var parser = new DOMParser(),
                input = parser.parseFromString(xmlIn, 'application/xml').childNodes[0],
                output = parser.parseFromString(xmlOut, 'application/xml').childNodes[0];
            
            expect(input.isEqualNode(output)).to.be.true;
        });

        it('keeps entities intact', function() {
            var xmlIn = '<section>&lt; &gt;</section>',
                doc = getDocumentFromXML(xmlIn),
                xmlOut = doc.toXML();
            expect(xmlOut).to.equal(xmlIn);
        });
        it('keeps entities intact when they form html/xml', function() {
            var xmlIn = '<section>&lt;abc&gt;</section>',
                doc = getDocumentFromXML(xmlIn),
                xmlOut = doc.toXML();
            expect(xmlOut).to.equal(xmlIn);
        });
    });

});

});