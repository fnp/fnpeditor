define(function(require) {
    
'use strict';

/* globals describe, it, afterEach */

var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
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
    var c = canvas.fromXMLDocument(getDocumentFromXML(xml), elements),
        view = c.view();
    view.attr('canvas-test', true);
    /* globals document */
    $(document.body).append(view);
    return c;
};
var removeCanvas = function() {
    $('[canvas-test]').remove();
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

describe('Keyboard interactions', function() {

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
        afterEach(removeCanvas);

        [K.BACKSPACE, K.DELETE].forEach(function(key) {
            it('deletes text withing a single text element ' + key, function() {
                var c = getCanvasFromXML('<section><div>Alice</div></section>'),
                    k = new Keyboard(c);

                k.withSelection('A|lice', 'Alic|e').press(key);
                expect(c.wlxmlDocument.root.contents()[0].contents()[0].getText()).to.equal('Ae');


                var selection = c.getSelection();
                expect(selection.type).to.equal('caret');
                expect(selection.element.getText()).to.equal('Ae');
                expect(selection.offset).to.equal(1);
            });
            it('deletes text across two paragraphs ' + key, function() {
                var c = getCanvasFromXML('<section><div class="p">Alice</div><div class="p">cat</div></section>'),
                    k = new Keyboard(c);

                k.withSelection('A|lice', 'c|at').press(key);
                var rootContents = c.wlxmlDocument.root.contents();

                expect(rootContents.length).to.equal(2);
                expect(rootContents[0].contents()[0].getText()).to.equal('A');
                expect(rootContents[1].contents()[0].getText()).to.equal('at');

                var selection = c.getSelection();
                expect(selection.type).to.equal('caret');
                expect(selection.element.wlxmlNode.getText()).to.equal(key === K.BACKSPACE ? 'A' : 'at');
            });

            it('keeps an empty paragraph after deleting its whole text ' + key, function() {
                var c = getCanvasFromXML('<section><div class="p">Alice</div></section>'),
                    k = new Keyboard(c);

                k.withSelection('|Alice', 'Alice|').press(key);
                var rootContents = c.wlxmlDocument.root.contents();

                expect(rootContents.length).to.equal(1);
                expect(rootContents[0].contents()[0].getText()).to.equal('');
                
                var selection = c.getSelection();
                expect(selection.type).to.equal('caret');
                expect(selection.element.wlxmlNode.parent().sameNode(c.wlxmlDocument.root.contents()[0]));
            });
        });

    });


    describe('backspace at the beginning of a block', function() {
        afterEach(removeCanvas);

        it('merges two adjacent paragraphs', function() {
            var c = getCanvasFromXML('<section><div class="p">A</div><div class="p">B</div></section>'),
                k = new Keyboard(c);

            k.withCaret('|B').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            expect(rootContents[0].getClass()).to.equal('p');
            expect(rootContents[0].contents()[0].getText()).to.equal('AB');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('AB', c))).to.equal(true);
            expect(selection.offset).to.equal(1);
        });
        it('merges a paragraph with a header', function() {
            var c = getCanvasFromXML('<section><header>A</header><div class="p">B</div></section>'),
                k = new Keyboard(c);

            k.withCaret('|B').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            expect(rootContents[0].getTagName()).to.equal('header');
            expect(rootContents[0].contents()[0].getText()).to.equal('AB');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('AB', c))).to.equal(true);
            expect(selection.offset).to.equal(1);
        });
        it('merges two adjacent headers', function() {
            var c = getCanvasFromXML('<section><header>A</header><header>B</header></section>'),
                k = new Keyboard(c);

            k.withCaret('|B').press(K.BACKSPACE);
            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            expect(rootContents[0].getTagName()).to.equal('header');
            expect(rootContents[0].contents()[0].getText()).to.equal('AB');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('AB', c))).to.equal(true);
            expect(selection.offset).to.equal(1);
        });
        it('merges a header with a paragraph', function() {
            var c = getCanvasFromXML('<section><div class="p">A</div><header>B</header></section>'),
                k = new Keyboard(c);

            k.withCaret('|B').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            expect(rootContents[0].is('p')).to.equal(true);
            expect(rootContents[0].contents()[0].getText()).to.equal('AB');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('AB', c))).to.equal(true);
            expect(selection.offset).to.equal(1);
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

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('itemparagraph', c))).to.equal(true);
            expect(selection.offset).to.equal(4);
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

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('item1item2', c))).to.equal(true);
            expect(selection.offset).to.equal(5);
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

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('item1', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });
        it('removes list after moving up its only item', function() {
            var c = getCanvasFromXML('<section><div class="list"><div class="item">item</div></div></section>'),
                k = new Keyboard(c);

            k.withCaret('|item').press(K.BACKSPACE);
            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            
            expect(rootContents[0].getClass()).to.equal('p');
            expect(rootContents[0].contents()[0].getText()).to.equal('item');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('item', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });
    });

    describe('backspace at the beginning of a span', function() {
        afterEach(removeCanvas);

        it('deletes span if it contains only one character', function() {
            var c = getCanvasFromXML('<section>Alice<span class="emp">h</span>a cat</section>'),
                k = new Keyboard(c);

            k.withCaret('h|').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            expect(rootContents[0].getText()).to.equal('Alicea cat');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('Alicea cat', c))).to.equal(true);
            expect(selection.offset).to.equal(5);
        });

        it('deletes from the end of the preceding text element', function() {
            var c = getCanvasFromXML('<section>Alice<span>has a cat</span></section>'),
                k = new Keyboard(c);

            k.withCaret('|has a cat').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(2);
            expect(rootContents[0].getText()).to.equal('Alic');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('has a cat', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });

        it('deletes from the end of the preceding text element - multiple spans', function() {
            var c = getCanvasFromXML('<section>Alice<span><span>has a cat</span></span></section>'),
                k = new Keyboard(c);

            k.withCaret('|has a cat').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(2);
            expect(rootContents[0].getText()).to.equal('Alic');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('has a cat', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });

        it('deletes from the end of the preceding span element content', function() {
            var c = getCanvasFromXML('<section><span>Alice</span><span>has a cat</span></section>'),
                k = new Keyboard(c);

            k.withCaret('|has a cat').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(2);
            expect(rootContents[0].is({tagName: 'span'})).to.equal(true);
            expect(rootContents[0].contents()[0].getText()).to.equal('Alic');

            expect(rootContents[1].contents()[0].getText()).to.equal('has a cat');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('has a cat', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });

        it('deletes from the end of the preceding span element content - multiple spans', function() {
            var c = getCanvasFromXML('<section><span>Alice</span><span><span>has a cat</span></span></section>'),
                k = new Keyboard(c);

            k.withCaret('|has a cat').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(2);
            expect(rootContents[0].is({tagName: 'span'})).to.equal(true);
            expect(rootContents[0].contents()[0].getText()).to.equal('Alic');

            var outerSpan = rootContents[1];
            expect(outerSpan.is({tagName: 'span'})).to.equal(true);

            var innerSpan = outerSpan.contents()[0];
            expect(innerSpan.contents()[0].getText()).to.equal('has a cat');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('has a cat', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });

        it('merges two paragrahps if span is a first content of the second paragraph', function() {
            var c = getCanvasFromXML('<section><div class="p">para</div><div class="p"><span>Alice</span> has a cat</div></section>'),
                k = new Keyboard(c);
            
            k.withCaret('|Alice').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();

            expect(rootContents.length).to.equal(1, 'single paragraph left');

            var p = rootContents[0],
                pContents = p.contents();

            expect(p.is('p')).to.equal(true);

            expect(pContents.length).to.equal(3);
            expect(pContents[0].getText()).to.equal('para');
            expect(pContents[1].contents().length).to.equal(1);
            expect(pContents[1].contents()[0].getText()).to.equal('Alice');

            expect(pContents[2].getText()).to.equal(' has a cat');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('Alice', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });
    });

    describe('backspace before a span', function() {
        it('deletes from the end of a span', function() {
            var c = getCanvasFromXML('<section><span>Alice</span>has a cat</section>'),
                k = new Keyboard(c);

            k.withCaret('|has a cat').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(2);
            expect(rootContents[0].is({tagName: 'span'})).to.equal(true);
            expect(rootContents[0].contents()[0].getText()).to.equal('Alic');
            expect(rootContents[1].getText()).to.equal('has a cat');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('has a cat', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });
        it('deletes span if it contains only one character', function() {
            var c = getCanvasFromXML('<section>Alice <span>h</span> a cat</section>'),
                k = new Keyboard(c);

            k.withCaret('| a cat').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(1);
            expect(rootContents[0].getText()).to.equal('Alice  a cat');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('Alice  a cat', c))).to.equal(true);
            expect(selection.offset).to.equal(6);
        });
    });

    describe('splitting with enter', function() {
        afterEach(removeCanvas);

        it('splits paragraph into two in the middle', function() {
            var c = getCanvasFromXML('<section><div class="p">paragraph</div></section>'),
                k = new Keyboard(c);

            k.withCaret('para|graph').press(K.ENTER);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(2);
            expect(rootContents[0].is({tagName: 'div', klass: 'p'})).to.equal(true);
            expect(rootContents[0].contents()[0].getText()).to.equal('para');
            expect(rootContents[1].is({tagName: 'div', klass: 'p'})).to.equal(true);
            expect(rootContents[1].contents()[0].getText()).to.equal('graph');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('graph', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });
        it('splits paragraph into two at the beginning', function() {
            var c = getCanvasFromXML('<section><div class="p">paragraph</div></section>'),
                k = new Keyboard(c);

            k.withCaret('|paragraph').press(K.ENTER);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(2);
            expect(rootContents[0].is({tagName: 'div', klass: 'p'})).to.equal(true);
            expect(rootContents[0].contents()[0].getText()).to.equal('');
            expect(rootContents[1].is({tagName: 'div', klass: 'p'})).to.equal(true);
            expect(rootContents[1].contents()[0].getText()).to.equal('paragraph');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });
        it('splits paragraph into two at the end', function() {
            var c = getCanvasFromXML('<section><div class="p">paragraph</div></section>'),
                k = new Keyboard(c);

            k.withCaret('paragraph|').press(K.ENTER);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(2);
            expect(rootContents[0].is({tagName: 'div', klass: 'p'})).to.equal(true);
            expect(rootContents[0].contents()[0].getText()).to.equal('paragraph');
            expect(rootContents[1].is({tagName: 'div', klass: 'p'})).to.equal(true);
            expect(rootContents[1].contents()[0].getText()).to.equal('');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });

        it('splits its parent box if inside a span', function() {
            var c = getCanvasFromXML('<section><div class="p">this <span>is</span> a paragraph</div></section>'),
                k = new Keyboard(c);

            k.withCaret('i|s').press(K.ENTER);

            var rootContents = c.wlxmlDocument.root.contents();

            expect(rootContents.length).to.equal(2);

            var p1 = rootContents[0],
                p2 = rootContents[1];

            expect(p1.is({tagName: 'div', klass: 'p'})).to.equal(true);
            expect(p2.is({tagName: 'div', klass: 'p'})).to.equal(true);

            var p1Contents = p1.contents(),
                p2Contents = p2.contents();

            expect(p1Contents[0].getText()).to.equal('this ');
            expect(p1Contents[1].is({tagName: 'span'})).to.equal(true);
            expect(p1Contents[1].contents()[0].getText()).to.equal('i');

            
            expect(p2Contents[0].is({tagName: 'span'})).to.equal(true);
            expect(p2Contents[0].contents()[0].getText()).to.equal('s');
            expect(p2Contents[1].getText()).to.equal(' a paragraph');

            var selection = c.getSelection();
            expect(selection.element.sameNode(getTextElement('s', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });

        it('splits its parent box if inside a double span', function() {
            var c = getCanvasFromXML('<section><div class="p">this <span test="outer"><span test="inner">is</span></span> a paragraph</div></section>'),
                k = new Keyboard(c);

            k.withCaret('i|s').press(K.ENTER);

            var rootContents = c.wlxmlDocument.root.contents();

            expect(rootContents.length).to.equal(2);

            var p1 = rootContents[0],
                p2 = rootContents[1];

            expect(p1.is({tagName: 'div', klass: 'p'})).to.equal(true);
            expect(p2.is({tagName: 'div', klass: 'p'})).to.equal(true);

            var p1Contents = p1.contents(),
                p2Contents = p2.contents();

            /* first paragraph */
            expect(p1Contents[0].getText()).to.equal('this ');
            
            var outer1 = p1Contents[1];
            expect(outer1.getAttr('test')).to.equal('outer');
            expect(outer1.contents().length).to.equal(1);
            var inner1 = outer1.contents()[0];
            expect(inner1.getAttr('test')).to.equal('inner');
            expect(inner1.contents()[0].getText()).to.equal('i');

            /* second paragraph */
            var outer2 = p2Contents[0];
            expect(outer2.getAttr('test')).to.equal('outer');
            expect(outer2.contents().length).to.equal(1);
            var inner2 = outer2.contents()[0];
            expect(inner2.getAttr('test')).to.equal('inner');
            expect(inner2.contents()[0].getText()).to.equal('s');

            expect(p2Contents[1].getText()).to.equal(' a paragraph');

            /* caret */
            var selection = c.getSelection();
            expect(selection.element.sameNode(getTextElement('s', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });
    });

    describe('Deleting text from a node', function() {
        it('deletes last character with backspace', function() {
            var c = getCanvasFromXML('<section><div class="p">a</div><div class="p">b</div></section>'),
                k = new Keyboard(c);

            k.withCaret('b|').press(K.BACKSPACE);

            var rootContents = c.wlxmlDocument.root.contents();
            expect(rootContents.length).to.equal(2);
            expect(rootContents[0].is({tagName: 'div', klass: 'p'})).to.equal(true);
            expect(rootContents[0].contents()[0].getText()).to.equal('a');
            expect(rootContents[1].is({tagName: 'div', klass: 'p'})).to.equal(true);
            expect(rootContents[1].contents()[0].getText()).to.equal('');

            var selection = c.getSelection();
            expect(selection.type).to.equal('caret');
            expect(selection.element.sameNode(getTextElement('', c))).to.equal(true);
            expect(selection.offset).to.equal(0);
        });
    });

});


});