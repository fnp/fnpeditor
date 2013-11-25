define([
    'libs/chai',
    'libs/sinon',
    './smartxml.js'
], function(chai, sinon, smartxml) {
    
'use strict';
/*jshint expr:true */
/* global describe, it, beforeEach, Node, DOMParser */

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

        it('knows if it contains an ElementNode in its tree', function() {
            var doc = getDocumentFromXML('<root><a></a>text</root>'),
                root = doc.root,
                a = root.contents()[0],
                text = root.contents()[1];

            expect(doc.containsNode(root)).to.equal(true, 'contains its root');
            expect(doc.containsNode(a)).to.equal(true, 'contains Element Node');
            expect(doc.containsNode(text)).to.equal(true, 'contains Text Node');
        });

        it('creates text nodes', function() {
            var doc = getDocumentFromXML('<div></div>'),
                emptyTextNode = doc.createDocumentNode({text:''}),
                nonEmptyTextNode = doc.createDocumentNode({text: 'alice'});
            expect(emptyTextNode.getText()).to.equal('', 'empty ok');
            expect(nonEmptyTextNode.getText()).to.equal('alice', 'non empty ok');
        });
    });

    describe('DocumentNode', function() {
        it('can be cloned', function() {
            var doc = getDocumentFromXML('<div>Alice</div>'),
                text = doc.root.contents()[0],
                clone, suffix;

            [doc.root, text].forEach(function(node) {
                suffix = ' (' + (node.nodeType === Node.TEXT_NODE ? 'text' : 'element')  + ')';
                clone = node.clone();
                expect(doc.containsNode(clone)).to.equal(false, 'clone is not contained in a document' + suffix);
                expect(node.sameNode(clone)).to.equal(false, 'clone is not same node as its originator' + suffix);
                expect(node.nativeNode.isEqualNode(clone.nativeNode)).to.equal(true, 'clone is identical as its originator' + suffix);
            });
        });

        it('knows its path in the document tree', function() {
            var doc = getDocumentFromXML('<root><a><b><c></c>text</b></a></root>'),
                root = doc.root,
                a = root.contents()[0],
                b = a.contents()[0],
                text = b.contents()[1];

            expect(root.getPath()).to.eql([], 'path of the root element is empty');
            expect(a.getPath()).to.eql([0]);
            expect(b.getPath()).to.eql([0, 0]);
            expect(text.getPath()).to.eql([0,0,1]);

            /* Paths relative to a given ancestor */
            expect(text.getPath(root)).to.eql([0,0,1]);
            expect(text.getPath(a)).to.eql([0,1]);
            expect(text.getPath(b)).to.eql([1]);
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

        it('puts NodeElement after itself', function() {
            var node = elementNodeFromXML('<div>Alice</div>'),
                textNode = node.contents()[0],
                returned = textNode.after({tagName:'div'});
            expect(returned.sameNode(node.contents()[1])).to.be.true;
        });

        it('puts NodeElement before itself', function() {
            var node = elementNodeFromXML('<div>Alice</div>'),
                textNode = node.contents()[0],
                returned = textNode.before({tagName:'div'});
            expect(returned.sameNode(node.contents()[0])).to.be.true;
        });

        describe('Wrapping TextNode contents', function() {

            it('wraps DocumentTextElement', function() {
                var node = elementNodeFromXML('<section>Alice</section>'),
                    textNode = node.contents()[0];
                
                var returned = textNode.wrapWith({tagName: 'header'}),
                    parent = textNode.parent(),
                    parent2 = node.contents()[0];

                expect(returned.sameNode(parent)).to.be.equal(true, 'wrapper is a parent');
                expect(returned.sameNode(parent2)).to.be.equal(true, 'wrapper has a correct parent');
                expect(returned.getTagName()).to.equal('header');
            });

            describe('wrapping part of DocumentTextElement', function() {
                [{start: 5, end: 12}, {start: 12, end: 5}].forEach(function(offsets) {
                    it('wraps in the middle ' + offsets.start + '/' + offsets.end, function() {
                        var node = elementNodeFromXML('<section>Alice has a cat</section>'),
                            textNode = node.contents()[0];
                        
                        var returned = textNode.wrapWith({tagName: 'header', attrs: {'attr1': 'value1'}, start: offsets.start, end: offsets.end}),
                            contents = node.contents();

                        expect(contents.length).to.equal(3);
                        
                        expect(contents[0].nodeType).to.be.equal(Node.TEXT_NODE, 'first node is text node');
                        expect(contents[0].getText()).to.equal('Alice');

                        expect(contents[1].sameNode(returned)).to.be.true;
                        expect(returned.getTagName()).to.equal('header');
                        expect(returned.getAttr('attr1')).to.equal('value1');
                        expect(contents[1].contents().length).to.equal(1, 'wrapper has one node inside');
                        expect(contents[1].contents()[0].getText()).to.equal(' has a ');

                        expect(contents[2].nodeType).to.be.equal(Node.TEXT_NODE, 'third node is text node');
                        expect(contents[2].getText()).to.equal('cat');
                    });
                });

                it('wraps whole text inside DocumentTextElement if offsets span entire content', function() {
                    var node = elementNodeFromXML('<section>Alice has a cat</section>'),
                         textNode = node.contents()[0];
                     
                    textNode.wrapWith({tagName: 'header', start: 0, end: 15});
                    
                    var contents = node.contents();
                    expect(contents.length).to.equal(1);
                    expect(contents[0].getTagName()).to.equal('header');
                    expect(contents[0].contents()[0].getText()).to.equal('Alice has a cat');
                });
            });
        });

    });

    describe('Manipulations', function() {

        describe('replacing node with another one', function() {
            it('replaces node with another one', function() {
                var doc = getDocumentFromXML('<div><a></a></div>'),
                    a = doc.root.contents()[0];

                var c = a.replaceWith({tagName: 'b', attrs: {b:'1'}});

                expect(doc.root.contents()[0].sameNode(c));
                expect(c.getTagName()).to.equal('b');
                expect(c.getAttr('b')).to.equal('1');
            });
            it('can replace document root', function() {
                var doc = getDocumentFromXML('<div></div>');

                var header = doc.root.replaceWith({tagName: 'header'});

                expect(doc.root.sameNode(header)).to.be.true;
                expect(doc.containsNode(header)).to.be.true;
            });
        });

        it('merges adjacent text nodes resulting from detaching an element node in between', function() {
            var doc = getDocumentFromXML('<div>Alice <span>has</span>a cat</div>'),
                span = doc.root.contents()[1];

            span.detach();

            var rootContents = doc.root.contents();
            expect(rootContents).to.have.length(1, 'one child left');
            expect(rootContents[0].getText()).to.equal('Alice a cat');
        });

        it('inserts node at index', function() {
            var doc = getDocumentFromXML('<div><a></a><b></b><c></c></div>'),
                b = doc.root.contents()[1];

            var inserted = doc.root.insertAtIndex({tagName: 'test'}, 1);

            expect(doc.root.contents()[1].sameNode(inserted)).to.equal(true, 'inserted node returned');
            expect(b.getIndex()).to.equal(2, 'b node shifted right');
        });

        it('appends node when inserting node at index out of range', function() {
            var doc = getDocumentFromXML('<div></div>');

            var test1 = doc.root.insertAtIndex({tagName: 'test1'}, 0),
                test2 = doc.root.insertAtIndex({tagName: 'test1'}, 10);

            expect(doc.root.contents()[0].sameNode(test1)).to.equal(true, 'inserting at index 0 of empty nodes appends node');
            expect(doc.root.contents().length).to.equal(1, 'inserting at index out of range does nothing');
            expect(test2).to.equal(undefined, 'inserting at index out of range returns undefined');
        });

        it('appends element node to another element node', function() {
            var node1 = elementNodeFromParams({tag: 'div'}),
                node2 = elementNodeFromParams({tag: 'a'}),
                node3 = elementNodeFromParams({tag: 'p'});
            node1.append(node2);
            node1.append(node3);
            expect(node1.contents()[0].sameNode(node2)).to.be.true;
            expect(node1.contents()[1].sameNode(node3)).to.be.true;
        });

        it('prepends element node to another element node', function() {
            var node1 = elementNodeFromParams({tag: 'div'}),
                node2 = elementNodeFromParams({tag: 'a'}),
                node3 = elementNodeFromParams({tag: 'p'});
            node1.prepend(node2);
            node1.prepend(node3);
            expect(node1.contents()[0].sameNode(node3)).to.be.true;
            expect(node1.contents()[1].sameNode(node2)).to.be.true;
        });

        it('wraps element node with another element node', function() {
            var node = elementNodeFromXML('<div></div>'),
                wrapper = elementNodeFromXML('<wrapper></wrapper>');

            node.wrapWith(wrapper);
            expect(node.parent().sameNode(wrapper)).to.be.true;
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

        it('unwrap single element node from its parent', function() {
            var doc = getDocumentFromXML('<div><a><b></b></a></div>'),
                div = doc.root,
                a = div.contents()[0],
                b = a.contents()[0];

            var parent = b.unwrap();

            expect(parent.sameNode(div)).to.equal(true, 'returns new parent');
            expect(div.contents()).to.have.length(1, 'root contains only one node');
            expect(div.contents()[0].sameNode(b)).to.equal(true, 'node got unwrapped');
        });

        it('unwrap single text node from its parent', function() {
            var doc = getDocumentFromXML('<div>Some <span>text</span>!</div>'),
                div = doc.root,
                span = div.contents()[1],
                text = span.contents()[0];

            var parent = text.unwrap();

            expect(parent.sameNode(div)).to.equal(true, 'returns new parent');
            expect(div.contents()).to.have.length(1, 'root contains only one node');
            expect(div.contents()[0].getText()).to.equal('Some text!');
        });

        describe('Wrapping text', function() {
            it('wraps text spanning multiple sibling TextNodes', function() {
                var section = elementNodeFromXML('<section>Alice has a <span>small</span> cat</section>'),
                    wrapper = section.wrapText({
                        _with: {tagName: 'span', attrs: {'attr1': 'value1'}},
                        offsetStart: 6,
                        offsetEnd: 4,
                        textNodeIdx: [0,2]
                    });

                expect(section.contents().length).to.equal(2);
                expect(section.contents()[0].nodeType).to.equal(Node.TEXT_NODE);
                expect(section.contents()[0].getText()).to.equal('Alice ');

                var wrapper2 = section.contents()[1];
                expect(wrapper2.sameNode(wrapper)).to.be.true;
                expect(wrapper.getTagName()).to.equal('span');

                var wrapperContents = wrapper.contents();
                expect(wrapperContents.length).to.equal(3);
                expect(wrapperContents[0].getText()).to.equal('has a ');

                expect(wrapperContents[1].nodeType).to.equal(Node.ELEMENT_NODE);
                expect(wrapperContents[1].contents().length).to.equal(1);
                expect(wrapperContents[1].contents()[0].getText()).to.equal('small');
            });
        });

        describe('Wrapping Nodes', function() {
            it('wraps multiple sibling nodes', function() {
                var section = elementNodeFromXML('<section>Alice<div>has</div><div>a cat</div></section>'),
                    aliceText = section.contents()[0],
                    firstDiv = section.contents()[1],
                    lastDiv = section.contents()[section.contents().length -1];

                var returned = section.document.wrapNodes({
                        node1: aliceText,
                        node2: lastDiv,
                        _with: {tagName: 'header'}
                    });

                var sectionContentss = section.contents(),
                    header = sectionContentss[0],
                    headerContents = header.contents();

                expect(sectionContentss).to.have.length(1);
                expect(header.sameNode(returned)).to.equal(true, 'wrapper returned');
                expect(header.parent().sameNode(section)).to.be.true;
                expect(headerContents).to.have.length(3);
                expect(headerContents[0].sameNode(aliceText)).to.equal(true, 'first node wrapped');
                expect(headerContents[1].sameNode(firstDiv)).to.equal(true, 'second node wrapped');
                expect(headerContents[2].sameNode(lastDiv)).to.equal(true, 'third node wrapped');
            });

            it('wraps multiple sibling Elements - middle case', function() {
                var section = elementNodeFromXML('<section><div></div><div></div><div></div><div></div></section>'),
                    div2 = section.contents()[1],
                    div3 = section.contents()[2];

                section.document.wrapNodes({
                        node1: div2,
                        node2: div3,
                        _with: {tagName: 'header'}
                    });

                var sectionContentss = section.contents(),
                    header = sectionContentss[1],
                    headerChildren = header.contents();

                expect(sectionContentss).to.have.length(3);
                expect(headerChildren).to.have.length(2);
                expect(headerChildren[0].sameNode(div2)).to.equal(true, 'first node wrapped');
                expect(headerChildren[1].sameNode(div3)).to.equal(true, 'second node wrapped');
            });
        });

    });

    describe('Splitting text', function() {
    
        it('splits TextNode\'s parent into two ElementNodes', function() {
            var doc = getDocumentFromXML('<section><header>Some header</header></section>'),
                section = doc.root,
                text = section.contents()[0].contents()[0];

            var returnedValue = text.split({offset: 5});
            expect(section.contents().length).to.equal(2, 'section has two children');
            
            var header1 = section.contents()[0];
            var header2 = section.contents()[1];

            expect(header1.getTagName()).to.equal('header', 'first section child ok');
            expect(header1.contents().length).to.equal(1, 'first header has one child');
            expect(header1.contents()[0].getText()).to.equal('Some ', 'first header has correct content');
            expect(header2.getTagName()).to.equal('header', 'second section child ok');
            expect(header2.contents().length).to.equal(1, 'second header has one child');
            expect(header2.contents()[0].getText()).to.equal('header', 'second header has correct content');

            expect(returnedValue.first.sameNode(header1)).to.equal(true, 'first node returned');
            expect(returnedValue.second.sameNode(header2)).to.equal(true, 'second node returned');
        });

        it('leaves empty copy of ElementNode if splitting at the very beginning', function() {
                var doc = getDocumentFromXML('<section><header>Some header</header></section>'),
                section = doc.root,
                text = section.contents()[0].contents()[0];

                text.split({offset: 0});
                
                var header1 = section.contents()[0];
                var header2 = section.contents()[1];

                expect(header1.contents().length).to.equal(0);
                expect(header2.contents()[0].getText()).to.equal('Some header');
        });

        it('leaves empty copy of ElementNode if splitting at the very end', function() {
                var doc = getDocumentFromXML('<section><header>Some header</header></section>'),
                section = doc.root,
                text = section.contents()[0].contents()[0];

                text.split({offset: 11});
                
                var header1 = section.contents()[0];
                var header2 = section.contents()[1];

                expect(header1.contents()[0].getText()).to.equal('Some header');
                expect(header2.contents().length).to.equal(0);
        });

        it('keeps TextNodes\'s parent\'s children elements intact', function() {
            var doc = getDocumentFromXML('<section><header>A <span>fancy</span> and <span>nice</span> header</header></section>'),
                section = doc.root,
                header = section.contents()[0],
                textAnd = header.contents()[2];

            textAnd.split({offset: 2});
            
            var sectionContents = section.contents();
            expect(sectionContents.length).to.equal(2, 'Section has two children');
            expect(sectionContents[0].getTagName()).to.equal('header', 'First section node is a header');
            expect(sectionContents[1].getTagName()).to.equal('header', 'Second section node is a header');

            var firstHeaderContents = sectionContents[0].contents();
            expect(firstHeaderContents.length).to.equal(3, 'First header has three children');
            expect(firstHeaderContents[0].getText()).to.equal('A ', 'First header starts with a text');
            expect(firstHeaderContents[1].getTagName()).to.equal('span', 'First header has span in the middle');
            expect(firstHeaderContents[2].getText()).to.equal(' a', 'First header ends with text');

            var secondHeaderContents = sectionContents[1].contents();
            expect(secondHeaderContents.length).to.equal(3, 'Second header has three children');
            expect(secondHeaderContents[0].getText()).to.equal('nd ', 'Second header starts with text');
            expect(secondHeaderContents[1].getTagName()).to.equal('span', 'Second header has span in the middle');
            expect(secondHeaderContents[2].getText()).to.equal(' header', 'Second header ends with text');
        });
    });

    describe('Events', function() {
        it('emits nodeDetached event on node detach', function() {
            var node = elementNodeFromXML('<div><div></div></div>'),
                innerNode = node.contents()[0],
                spy = sinon.spy();
            node.document.on('change', spy);
            
            var detached = innerNode.detach(),
                event = spy.args[0][0];

            expect(event.type).to.equal('nodeDetached');
            expect(event.meta.node.sameNode(detached, 'detached node in event meta'));
            expect(event.meta.parent.sameNode(node), 'original parent node in event meta');
        }),

        it('emits nodeAdded event when appending new node', function() {
            var node = elementNodeFromXML('<div></div>'),
                spy = sinon.spy();
            node.document.on('change', spy);
            
            var appended = node.append({tagName:'div'}),
                event = spy.args[0][0];
            expect(event.type).to.equal('nodeAdded');
            expect(event.meta.node.sameNode(appended)).to.be.true;
        });
        
        it('emits nodeMoved when appending aready existing node', function() {
            var node = elementNodeFromXML('<div><a></a><b></b></div>'),
                a = node.contents()[0],
                b = node.contents()[1],
                spy = sinon.spy();
            node.document.on('change', spy);
            
            var appended = a.append(b),
                event = spy.args[0][0];

            expect(spy.callCount).to.equal(1);
            expect(event.type).to.equal('nodeMoved');
            expect(event.meta.node.sameNode(appended)).to.be.true;
        });
        
        it('emits nodeAdded event when prepending new node', function() {
            var node = elementNodeFromXML('<div></div>'),
                spy = sinon.spy();
            node.document.on('change', spy);
            
            var prepended = node.prepend({tagName:'div'}),
                event = spy.args[0][0];
            expect(event.type).to.equal('nodeAdded');
            expect(event.meta.node.sameNode(prepended)).to.be.true;
        });
        
        it('emits nodeMoved when prepending aready existing node', function() {
            var node = elementNodeFromXML('<div><a></a><b></b></div>'),
                a = node.contents()[0],
                b = node.contents()[1],
                spy = sinon.spy();
            node.document.on('change', spy);
            
            var prepended = a.prepend(b),
                event = spy.args[0][0];
            expect(spy.callCount).to.equal(1);
            expect(event.type).to.equal('nodeMoved');
            expect(event.meta.node.sameNode(prepended)).to.be.true;
        });
        
        it('emits nodeAdded event when inserting node after another', function() {
            var node = elementNodeFromXML('<div><a></a></div>').contents()[0],
                spy = sinon.spy();
            node.document.on('change', spy);
            
            var inserted = node.after({tagName:'div'}),
                event = spy.args[0][0];
            expect(event.type).to.equal('nodeAdded');
            expect(event.meta.node.sameNode(inserted)).to.be.true;
        });
        
        it('emits nodeMoved when inserting aready existing node after another', function() {
            var node = elementNodeFromXML('<div><a></a><b></b></div>'),
                a = node.contents()[0],
                b = node.contents()[1],
                spy = sinon.spy();
            node.document.on('change', spy);
            var inserted = b.after(a),
                event = spy.args[0][0];

            expect(spy.callCount).to.equal(1);
            expect(event.type).to.equal('nodeMoved');
            expect(event.meta.node.sameNode(inserted)).to.be.true;
        });

        it('emits nodeAdded event when inserting node before another', function() {
            var node = elementNodeFromXML('<div><a></a></div>').contents()[0],
                spy = sinon.spy();
            node.document.on('change', spy);
            
            var inserted = node.before({tagName:'div'}),
                event = spy.args[0][0];
            expect(event.type).to.equal('nodeAdded');
            expect(event.meta.node.sameNode(inserted)).to.be.true;
        });
        
        it('emits nodeAdded when inserting aready existing node before another', function() {
            var node = elementNodeFromXML('<div><a></a><b></b></div>'),
                a = node.contents()[0],
                b = node.contents()[1],
                spy = sinon.spy();
            node.document.on('change', spy);
            var inserted = a.before(b),
                event = spy.args[0][0];

            expect(spy.callCount).to.equal(1);
            expect(event.type).to.equal('nodeMoved');
            expect(event.meta.node.sameNode(inserted)).to.be.true;
        });

        it('emits nodeDetached and nodeAdded when replacing root node with another', function() {
            var doc = getDocumentFromXML('<a></a>'),
                oldRoot = doc.root,
                spy = sinon.spy();

            doc.on('change', spy);

            doc.root.replaceWith({tagName: 'b'});

            expect(spy.callCount).to.equal(2);

            var event1 = spy.args[0][0],
                event2 = spy.args[1][0];

            expect(event1.type).to.equal('nodeDetached');
            expect(event1.meta.node.sameNode(oldRoot)).to.equal(true, 'root node in nodeDetached event metadata');
            expect(event2.type).to.equal('nodeAdded');
            expect(event2.meta.node.sameNode(doc.root)).to.equal(true, 'new root node in nodelAdded event meta');
        });


        ['append', 'prepend', 'before', 'after'].forEach(function(insertionMethod) {
            it('emits nodeDetached for node moved from a document tree to out of document node ' + insertionMethod, function() {
                var doc = getDocumentFromXML('<div><a></a></div>'),
                    a = doc.root.contents()[0],
                    spy = sinon.spy();

                doc.on('change', spy);

                var newNode = doc.createDocumentNode({tagName: 'b'}),
                    newNodeInner = newNode.append({tagName:'c'});

                newNodeInner[insertionMethod](a);

                var event = spy.args[0][0];
                expect(event.type).to.equal('nodeDetached');
                expect(event.meta.node.sameNode(a));
            });
        });


    });

    describe('Traversing', function() {
        describe('Basic', function() {
            it('can access node parent', function() {
                var doc = getDocumentFromXML('<a><b></b></a>'),
                    a = doc.root,
                    b = a.contents()[0];

                expect(a.parent()).to.equal(null, 'parent of a root is null');
                expect(b.parent().sameNode(a)).to.be.true;
            });
            it('can access node parents', function() {
                var doc = getDocumentFromXML('<a><b><c></c></b></a>'),
                    a = doc.root,
                    b = a.contents()[0],
                    c = b.contents()[0];

                var parents = c.parents();
                expect(parents).to.eql([b,a]);
            });
        });

        describe('finding sibling parents of two elements', function() {
            it('returns elements themself if they have direct common parent', function() {
                var doc = getDocumentFromXML('<section><div><div>A</div><div>B</div></div></section>'),
                    wrappingDiv = doc.root.contents()[0],
                    divA = wrappingDiv.contents()[0],
                    divB = wrappingDiv.contents()[1];

                var siblingParents = doc.getSiblingParents({node1: divA, node2: divB});

                expect(siblingParents.node1.sameNode(divA)).to.equal(true, 'divA');
                expect(siblingParents.node2.sameNode(divB)).to.equal(true, 'divB');
            });

            it('returns sibling parents - example 1', function() {
                var doc = getDocumentFromXML('<section>Alice <span>has a cat</span></section>'),
                    aliceText = doc.root.contents()[0],
                    span = doc.root.contents()[1],
                    spanText = span.contents()[0];

                var siblingParents = doc.getSiblingParents({node1: aliceText, node2: spanText});

                expect(siblingParents.node1.sameNode(aliceText)).to.equal(true, 'aliceText');
                expect(siblingParents.node2.sameNode(span)).to.equal(true, 'span');
            });
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

    describe('Undo/redo', function() {
        it('does work', function() {
            var doc = getDocumentFromXML('<section><span>Alice</span></section>'),
                span = doc.root.contents()[0];

            doc.transform('detach3', {node: span});


            doc.undo();

            expect(doc.root.contents()).to.have.length(1);
            expect(doc.root.contents()[0].getTagName()).to.equal('span');
            expect(doc.root.contents()[0].contents()[0].getText()).to.equal('Alice');

            doc.redo();
            expect(doc.root.contents()).to.have.length(0);

            doc.undo();
            expect(doc.root.contents()).to.have.length(1);
            expect(doc.root.contents()[0].getTagName()).to.equal('span');
            expect(doc.root.contents()[0].contents()[0].getText()).to.equal('Alice');

        });
    });

});

});