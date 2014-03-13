define([
'libs/jquery',
'libs/chai',
'libs/sinon',
'modules/documentCanvas/canvas/canvas',
'modules/documentCanvas/canvas/utils',
'wlxml/wlxml'
], function($, chai, sinon, canvas, utils, wlxml) {
    
'use strict';
/* global describe, it, beforeEach, afterEach */

var expect = chai.expect;

var getCanvasFromXML = function(xml) {
    return canvas.fromXMLDocument(getDocumentFromXML(xml));
};

var getDocumentFromXML = function(xml) {
    return wlxml.WLXMLDocumentFromXML(xml);
};

var wait = function(callback, timeout) {
    /* globals window */
    return window.setTimeout(callback, timeout || 0.5);
};


describe('new Canvas', function() {
    it('abc', function() {
        var doc = wlxml.WLXMLDocumentFromXML('<section>Alice <span>has</span> a cat!</div>'),
            c = canvas.fromXMLDocument(doc);

        expect(c.doc().children()).to.have.length(3);
        expect(c.doc().children()[0].canvas).to.equal(c);
        expect(c.doc().children()[0].wlxmlNode.sameNode(doc.root));
    });
});

describe('Handling empty text nodes', function() {
    it('puts zero width space into node with about to be remove text', function(done) {
        var c = getCanvasFromXML('<section>Alice</section>'),
            textElement = c.doc().children()[0];
        textElement.setText('');

        /* Wait for MutationObserver to kick in. */
        wait(function() {
            expect(textElement.getText({raw:true})).to.equal(utils.unicode.ZWS, 'ZWS in canvas');
            expect(c.wlxmlDocument.root.contents()[0].getText()).to.equal('', 'empty string in a document');
            done();
        });
    });
});

describe('Handling changes to the document', function() {
    it('replaces the whole canvas content when document root node replaced', function() {
        var doc = getDocumentFromXML('<section></section>'),
            c = canvas.fromXMLDocument(doc);

        var header = doc.root.replaceWith({tagName: 'header'});
        expect(c.doc().wlxmlNode.sameNode(header)).to.equal(true);
    });
});

describe('Listening to document changes', function() {

    it('Handling element node moved', function() {
        var doc = getDocumentFromXML('<section><a></a><b></b></section>'),
            a = doc.root.contents()[0],
            b = doc.root.contents()[1],
            c = canvas.fromXMLDocument(doc);

        a.before(b);
        var sectionChildren = c.doc().children();
        expect(sectionChildren.length).to.equal(2);
        expect(sectionChildren[0].getWlxmlTag()).to.equal('b');
        expect(sectionChildren[1].getWlxmlTag()).to.equal('a');
    });

    it('Handling text node moved', function() {
        var doc = getDocumentFromXML('<section><a></a>Alice</section>'),
            a = doc.root.contents()[0],
            textNode = doc.root.contents()[1],
            c = canvas.fromXMLDocument(doc);

        a.before(textNode);
        var sectionChildren = c.doc().children();
        expect(sectionChildren.length).to.equal(2);
        expect(sectionChildren[0].getText()).to.equal('Alice');
        expect(sectionChildren[1].getWlxmlTag()).to.equal('a');
    });

    it('Handles nodeTagChange event', function() {

        var doc = wlxml.WLXMLDocumentFromXML('<section><div>Alice</div></section>'),
            c = canvas.fromXMLDocument(doc);

        doc.root.contents()[0].setTag('header');

        var headerNode = doc.root.contents()[0],
            headerElement = c.doc().children()[0];

        expect(headerElement.getWlxmlTag()).to.equal('header', 'element ok');

        /* Make sure we handle invalidation of reference to wlxmlNode after changing its tag */
        expect(headerNode.getData('canvasElement').sameNode(headerElement)).to.equal(true, 'node->element');
        expect(headerElement.wlxmlNode.sameNode(headerNode)).to.equal(true, 'element->node');
    });

    it('Handles nodeDetached event for an empty text node', function(done) {
        var doc = wlxml.WLXMLDocumentFromXML('<section><div>A<span>b</span></div></section>'),
            aTextNode = doc.root.contents()[0].contents()[0],
            aTextElement;

        canvas.fromXMLDocument(doc);
        aTextElement = utils.findCanvasElementInParent(aTextNode, aTextNode.parent()); // TODO: This really should be easier...

        aTextElement.setText('');

        wait(function() {
            var parent = aTextElement.parent();
            expect(aTextElement.getText({raw:true})).to.equal(utils.unicode.ZWS, 'canvas represents this as empty node');
            aTextElement.wlxmlNode.detach();
            expect(parent.children().length).to.equal(1);
            expect(parent.children()[0].getWlxmlTag()).to.equal('span');
            done();
        });
    });
});

describe('Displaying span nodes', function() {
    it('inlines a span element with a text', function() {
        var c = getCanvasFromXML('<section><span>Alice</span></section>'),
            spanElement = c.doc().children()[0];
        expect(spanElement.isBlock()).to.equal(false);
    });
    it('renders non-span element as a block', function() {
        var c = getCanvasFromXML('<section><span></span></section>'),
            element = c.doc().children()[0],
            node = element.wlxmlNode;

        expect(element.isBlock()).to.equal(false, 'initially inline');
        node = node.setTag('div');
        expect(node.getData('canvasElement').isBlock()).to.equal(true, 'block');
    });

    it('inlines a span element if its block content gets removed', function() {
        var c = getCanvasFromXML('<section><span>Alice <div>has</div> a cat!</span></section>'),
            spanElement = c.doc().children()[0],
            divNode = spanElement.wlxmlNode.contents()[1];

        expect(spanElement.isBlock()).to.equal(true, 'initially a block');
        divNode.detach();
        expect(spanElement.isBlock()).to.equal(false, 'inlined after removing inner block');
        
        spanElement.wlxmlNode.append({tagName: 'div'});

        expect(spanElement.isBlock()).to.equal(true, 'block again after bringing back inner block');
    });

    it('keeps showing element as a block after changing its node tag to span if it contains elements of non-span nodes', function() {
        var c = getCanvasFromXML('<section><div><div></div></div></section>'),
            outerDivElement = c.doc().children()[0],
            outerDivNode = outerDivElement.wlxmlNode;
        outerDivNode = outerDivNode.setTag('span');
        expect(c.doc().children()[0].isBlock()).to.equal(true);
    });
});

describe('Cursor', function() {
    /* globals Node */
    var getSelection;

    var findTextNode = function(inside, text) {
        var nodes = inside.find(':not(iframe)').addBack().contents().filter(function() {
            return this.nodeType === Node.TEXT_NODE && this.data === text;
        });
        if(nodes.length) {
            return nodes[0];
        }
        return null;
    };

    beforeEach(function() {
        /* globals window */
        getSelection = sinon.stub(window, 'getSelection');
    });

    afterEach(function() {
        getSelection.restore();
    });

    it('returns position when browser selection collapsed', function() {
        var c = getCanvasFromXML('<section>Alice has a cat</section>'),
            dom = c.doc().dom(),
            text = findTextNode(dom, 'Alice has a cat');

        expect(text.nodeType).to.equal(Node.TEXT_NODE, 'correct node selected');
        expect($(text).text()).to.equal('Alice has a cat');

        getSelection.returns({
            anchorNode: text,
            focusNode: text,
            anchorOffset: 5,
            focusOffset: 5,
            isCollapsed: true
        });
        var cursor = c.getCursor(),
            position = cursor.getPosition();

        expect(cursor.isSelecting()).to.equal(false, 'cursor is not selecting anything');
        expect(position.element.getText()).to.equal('Alice has a cat');
        expect(position.offset).to.equal(5);
        expect(position.offsetAtEnd).to.equal(false, 'offset is not at end');

        getSelection.returns({
            anchorNode: text,
            focusNode: text,
            anchorOffset: 15,
            focusOffset: 15,
            isCollapsed: true
        });

        expect(cursor.getPosition().offsetAtEnd).to.equal(true, 'offset at end');
    });

    it('recognizes selection start and end on document order', function() {
        var c = getCanvasFromXML('<section><span>Alice</span><span>has a cat</span><div>abc<span>...</span>cde</div></section>'),
            dom = c.doc().dom(),
            textFirst = findTextNode(dom, 'Alice'),
            textSecond = findTextNode(dom, 'has a cat'),
            textAbc = findTextNode(dom, 'abc'),
            textCde = findTextNode(dom, 'cde');

        var check = function(label, expected) {
            var cursor = c.getCursor();
            label = label + ': ';
            expect(cursor.getSelectionStart().element.getText()).to.equal(expected.start.text, label + 'start element ok');
            expect(cursor.getSelectionStart().offset).to.equal(expected.start.offset, label + 'start offset ok');
            expect(cursor.getSelectionEnd().element.getText()).to.equal(expected.end.text, label + 'end element ok');
            expect(cursor.getSelectionEnd().offset).to.equal(expected.end.offset, label + 'end offset ok');
        };

        getSelection.returns({
            anchorNode: textFirst,
            focusNode: textFirst,
            anchorOffset: 1,
            focusOffset: 3,
            isCollapsed: false
        });

        check('same element, anchor first', {
            start: {text: 'Alice', offset: 1},
            end: {text: 'Alice', offset:3}
        });


        getSelection.returns({
            anchorNode: textFirst,
            focusNode: textFirst,
            anchorOffset: 3,
            focusOffset: 1,
            isCollapsed: false
        });

        check('same element, anchor second', {
            start: {text: 'Alice', offset: 1},
            end: {text: 'Alice', offset:3}
        });


        getSelection.returns({
            anchorNode: textAbc,
            focusNode: textCde,
            anchorOffset: 3,
            focusOffset: 1,
            isCollapsed: false
        });

        check('same parent, anchor first', {
            start: {text: 'abc', offset: 3},
            end: {text: 'cde', offset:1}
        });


        getSelection.returns({
            anchorNode: textCde,
            focusNode: textAbc,
            anchorOffset: 1,
            focusOffset: 3,
            isCollapsed: false
        });

        check('same parent, anchor second', {
            start: {text: 'abc', offset: 3},
            end: {text: 'cde', offset:1}
        });


        getSelection.returns({
            anchorNode: textFirst,
            focusNode: textSecond,
            anchorOffset: 1,
            focusOffset: 3,
            isCollapsed: false
        });

        check('different parents, anchor first', {
            start: {text: 'Alice', offset: 1},
            end: {text: 'has a cat', offset:3}
        });


        getSelection.returns({
            anchorNode: textSecond,
            focusNode: textFirst,
            anchorOffset: 3,
            focusOffset: 1,
            isCollapsed: false
        });

        check('different parents, anchor second', {
            start: {text: 'Alice', offset: 1},
            end: {text: 'has a cat', offset:3}
        });
    });

    it('returns boundries of selection when browser selection not collapsed', function() {
        var c = getCanvasFromXML('<section>Alice <span>has</span> a <span>big</span> cat</section>'),
            dom = c.doc().dom(),
            text = {
                alice: findTextNode(dom, 'Alice '),
                has: findTextNode(dom, 'has'),
                cat: findTextNode(dom, ' cat')
            },
            cursor = c.getCursor(),
            aliceElement = c.getDocumentElement(text.alice),
            catElement = c.getDocumentElement(text.cat);

        [
            {focus: text.alice, focusOffset: 1, anchor: text.cat,   anchorOffset: 2, selectionAnchor: catElement},
            {focus: text.cat,   focusOffset: 2, anchor: text.alice, anchorOffset: 1, selectionAnchor: aliceElement}
        ].forEach(function(s, idx) {
            getSelection.returns({isColapsed: false, anchorNode: s.anchor, anchorOffset: s.anchorOffset, focusNode: s.focus, focusOffset: s.focusOffset});

            var selectionStart = cursor.getSelectionStart(),
                selectionEnd = cursor.getSelectionEnd(),
                selectionAnchor = cursor.getSelectionAnchor();

            expect(cursor.isSelecting()).to.equal(true, 'cursor is selecting');
            expect(selectionStart.element.sameNode(aliceElement)).to.equal(true, '"Alice" is the start of the selection ' + idx);
            expect(selectionStart.offset).to.equal(1, '"Alice" offset ok' + idx);
            expect(selectionEnd.element.sameNode(catElement)).to.equal(true, '"Cat" is the start of the selection ' + idx);
            expect(selectionEnd.offset).to.equal(2, '"Cat" offset ok' + idx);
            expect(selectionAnchor.element.sameNode(s.selectionAnchor)).to.equal(true, 'anchor ok');
            expect(selectionAnchor.offset).to.equal(s.anchorOffset, 'anchor offset ok');
        });
    });

    it('recognizes when browser selection boundries lies in sibling DocumentTextElements', function() {
        var c = getCanvasFromXML('<section>Alice <span>has</span> a <span>big</span> cat</section>'),
            dom = c.doc().dom(),
            text = {
                alice: findTextNode(dom, 'Alice '),
                has: findTextNode(dom, 'has'),
                a: findTextNode(dom, ' a '),
                big: findTextNode(dom, 'big'),
                cat: findTextNode(dom, ' cat'),
            },
            cursor = c.getCursor();

        expect($(text.alice).text()).to.equal('Alice ');
        expect($(text.has).text()).to.equal('has');
        expect($(text.a).text()).to.equal(' a ');
        expect($(text.big).text()).to.equal('big');
        expect($(text.cat).text()).to.equal(' cat');

        getSelection.returns({anchorNode: text.alice, focusNode: text.a});
        expect(cursor.isSelectingSiblings()).to.equal(true, '"Alice" and "a" are children');

        getSelection.returns({anchorNode: text.alice, focusNode: text.cat});
        expect(cursor.isSelectingSiblings()).to.equal(true, '"Alice" and "cat" are children');

        getSelection.returns({anchorNode: text.alice, focusNode: text.has});
        expect(cursor.isSelectingSiblings()).to.equal(false, '"Alice" and "has" are not children');

        getSelection.returns({anchorNode: text.has, focusNode: text.big});
        expect(cursor.isSelectingSiblings()).to.equal(false, '"has" and "big" are not children');
    });
});

});