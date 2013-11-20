define([
'libs/chai',
'modules/documentCanvas/canvas/canvas',
'modules/documentCanvas/canvas/documentElement',
'modules/documentCanvas/canvas/utils',
'wlxml/wlxml'
], function(chai, canvas, documentElement, utils, wlxml) {
    
'use strict';

var expect = chai.expect;


var nodeFromXML = function(xml) {
    return wlxml.WLXMLElementNodeFromXML(xml);
};

var getCanvasFromXML = function(xml) {
    return canvas.fromXMLDocument(wlxml.WLXMLDocumentFromXML(xml));
};


describe('new Canvas', function() {
    it('abc', function() {
        var doc = wlxml.WLXMLDocumentFromXML('<section>Alice <span>has</span> a cat!</div>'),
            c = canvas.fromXMLDocument(doc);

        expect(c.doc().children()).to.have.length(3)
    });
})

describe('Cursor', function() {

    var getSelection;

    var findTextNode = function(inside, text) {
        var nodes = inside.find(':not(iframe)').addBack().contents().filter(function() {
            return this.nodeType === Node.TEXT_NODE && this.data === text;
        });
        if(nodes.length)
            return nodes[0];
        return null;
    }

    beforeEach(function() {
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