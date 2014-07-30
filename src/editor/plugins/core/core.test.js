define(function(require) {
    
'use strict';
/* globals describe, it */

var _ = require('libs/underscore'),
    chai = require('libs/chai'),
    sinon = require('libs/sinon'),
    wlxml = require('wlxml/wlxml'),
    canvas = require('modules/documentCanvas/canvas/canvas'),
    keyboard = require('modules/documentCanvas/canvas/keyboard'),
    keyEvent = require('modules/documentCanvas/canvas/keyEvent'),
    corePlugin = require('./core.js'),
    expect = chai.expect;

var K = keyboard.KEYS;

var getDocumentFromXML = function(xml, options) {
    var doc = wlxml.WLXMLDocumentFromXML(xml, options || {});
    doc.registerExtension(corePlugin.documentExtension);
    return doc;
};


var getCanvasFromXML = function(xml, elements) {
    return canvas.fromXMLDocument(getDocumentFromXML(xml), elements);
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

var getTextElement = function(text, c) {
    var node = getTextNode(text, c.wlxmlDocument),
        element =  node && node.getData('canvasElement');
    if(!(element && element.getText() === text)) {
        throw new Error();
    }
    return element;
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

describe.only('Keyboard interactions', function() {

    var Keyboard = function(canvas) {
        this.canvas = canvas;
    };

    _.extend(Keyboard.prototype, {
        press: function(key) {
            this.canvas.triggerKeyEvent(keyEvent.fromParams({key:key}), this.selection);
            this.selection = this.canvas.getSelection();
            return this;
        },
        withCaret: function(where) {
            var offset = where.indexOf('|'),
                text = where.split('|').join(''),
                el = getTextElement(text, this.canvas),
                selection = this.canvas.createSelection({type: 'caret', element: el, offset: offset});
            if(offset === -1) {
                throw new Error('Invalid caret');
            }
            this.selection = selection;
            return this;
        },
        withSelection: function(start, end) {
            var startOffset = start.indexOf('|'),
                endOffset = end.indexOf('|'),
                startText= start.split('|').join(''),
                endText = end.split('|').join(''),
                startElement = getTextElement(startText, this.canvas),
                endElement = getTextElement(endText, this.canvas),
                selection = this.canvas.createSelection({
                    type: 'textSelection', 
                    anchorElement: startElement,
                    anchorOffset: startOffset,
                    focusElement: endElement,
                    focusOffset: endOffset
                });
            if(startOffset === -1 || endOffset === -1) {
                throw new Error('Invalid text selection');
            }
            this.selection = selection;
            return this;    
        }
    });

    describe('deleting text with selection', function() {
        [K.BACKSPACE, K.DELETE].forEach(function(key) {
            it('deletes text withing a single text element ' + key, function() {
                var c = getCanvasFromXML('<section><div>Alice</div></section>'),
                    k = new Keyboard(c);

                k.withSelection('A|lice', 'Alic|e').press(key);
                expect(c.wlxmlDocument.root.contents()[0].contents()[0].getText()).to.equal('Ae');
            });
            it('deletes text across two paragraphs ' + key, function() {
                var c = getCanvasFromXML('<section><div class="p">Alice</div><div class="p">cat</div></section>'),
                    k = new Keyboard(c);

                k.withSelection('A|lice', 'c|at').press(key);
                var rootContents = c.wlxmlDocument.root.contents();

                expect(rootContents.length).to.equal(2);
                expect(rootContents[0].contents()[0].getText()).to.equal('A');
                expect(rootContents[1].contents()[0].getText()).to.equal('at');
            });

            it('keeps an empty paragraph after deleting its whole text ' + key, function() {
                var c = getCanvasFromXML('<section><div class="p">Alice</div></section>'),
                    k = new Keyboard(c);

                k.withSelection('|Alice', 'Alice|').press(key);
                var rootContents = c.wlxmlDocument.root.contents();

                expect(rootContents.length).to.equal(1);
                expect(rootContents[0].contents()[0].getText()).to.equal('');
            });
        });

    });

    // describe('deleting with a caret', function() {
    //     it('keeps an empty paragraph after deleteing last letter with backspace', function() {
    //         var c = getCanvasFromXML('<section><div class="p">A</div></section>'),
    //             k = new Keyboard(c);

    //         k.withCaret('A|').press(K.BACKSPACE);
    //         var rootContents = c.wlxmlDocument.root.contents();

    //         expect(rootContents.length).to.equal(1);
    //         expect(rootContents[0].contents()[0].getText()).to.equal('');    
    //     });
    //     // it('removes a paragraph on yet another delete' + key, function() {

    //     // });
    // });
    

            // + empty when bck/ins + l===1

    describe('backspace at the beginning', function() {
        it('merges two adjacent paragraphs', function() {
            var c = getCanvasFromXML('<section><div class="p">A</div><div class="p">B</div></section>'),
                k = new Keyboard(c);

            k.withCaret('|B').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            expect(rootContents[0].getClass()).to.equal('p');
            expect(rootContents[0].contents()[0].getText()).to.equal('AB');
        });
        it('merges a paragraph with a header', function() {
            var c = getCanvasFromXML('<section><header>A</header><div class="p">B</div></section>'),
                k = new Keyboard(c);

            k.withCaret('|B').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            expect(rootContents[0].getTagName()).to.equal('header');
            expect(rootContents[0].contents()[0].getText()).to.equal('AB');
        });
        it('merges two adjacent headers', function() {
            var c = getCanvasFromXML('<section><header>A</header><header>B</header></section>'),
                k = new Keyboard(c);

            k.withCaret('|B').press(K.BACKSPACE);
            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            expect(rootContents[0].getTagName()).to.equal('header');
            expect(rootContents[0].contents()[0].getText()).to.equal('AB');
        });
        it('merges a header with a paragraph', function() {
            var c = getCanvasFromXML('<section><div class="p">A</div><header>B</header></section>'),
                k = new Keyboard(c);

            k.withCaret('|B').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            expect(rootContents[0].is('p')).to.equal(true);
            expect(rootContents[0].contents()[0].getText()).to.equal('AB');
        });
        it('merges a paragraph into a last list item', function() {
            var c = getCanvasFromXML('<section><div class="list"><div class="item">item</div></div><div class="p">paragraph</div></section>'),
                list = c.wlxmlDocument.root.contents()[0],
                k = new Keyboard(c);

            k.withCaret('|paragraph').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            expect(rootContents[0].sameNode(list)).to.equal(true);

            var items = list.contents();
            expect(items.length).to.equal(1);
            expect(items[0].contents()[0].getText()).to.equal('itemparagraph');
        });
        it('merges a list item with a list item', function() {
            var c = getCanvasFromXML('<section><div class="list"><div class="item">item1</div><div class="item">item2</div></div></section>'),
                list = c.wlxmlDocument.root.contents()[0],
                k = new Keyboard(c);

            k.withCaret('|item2').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            
            expect(rootContents[0].sameNode(list)).to.equal(true);

            var items = list.contents();

            expect(items.length).to.equal(1);
            expect(items[0].contents()[0].getText()).to.equal('item1item2');
        });
        it('creates a new paragraph preceding the list from a first list item', function() {
            var c = getCanvasFromXML('<section><div class="list"><div class="item">item1</div><div class="item">item2</div></div></section>'),
                list = c.wlxmlDocument.root.contents()[0],
                k = new Keyboard(c);

            k.withCaret('|item1').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(2);
            
            expect(rootContents[0].getClass()).to.equal('p');
            expect(rootContents[0].contents()[0].getText()).to.equal('item1');

            expect(rootContents[1].sameNode(list)).to.equal(true);
        });
        it('removes list after moving up its only item', function() {
            var c = getCanvasFromXML('<section><div class="list"><div class="item">item</div></div></section>'),
                k = new Keyboard(c);

            k.withCaret('|item').press(K.BACKSPACE);
            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            
            expect(rootContents[0].getClass()).to.equal('p');
            expect(rootContents[0].contents()[0].getText()).to.equal('item');
        });
    });


});


});