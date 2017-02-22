define([
    'libs/chai',
    './wlxml.js'
], function(chai, wlxml) {
    
'use strict';

/* jshint expr:true */
/* global it, describe, beforeEach */

var expect = chai.expect;

var nodeFromXML = function(xml) {
    return wlxml.WLXMLElementNodeFromXML(xml);
};

var getDocumentFromXML = function(xml, options) {
    return wlxml.WLXMLDocumentFromXML(xml, options || {});
};


describe('WLXMLDocument', function() {
    
    describe('Basic wlxml element node properties', function() {
        it('returns its class', function() {
            var node = nodeFromXML('<header class="class.subclass"></header>');
            expect(node.getClass()).to.equal('class.subclass');
        });

        it('returns its class hierarchy', function() {
            var node = nodeFromXML('<div class="a.b.c"></div>');
            expect(node.getClassHierarchy()).to.eql(['', 'a', 'a.b', 'a.b.c']);
        });
    });

    describe('White space handling', function() {
        /* globals Node */

        it('ignores white space surrounding block elements', function() {
            var node = nodeFromXML('<section> <div></div> </section>'),
                contents = node.contents();
            expect(contents).to.have.length(1);
            expect(contents[0].nodeType).to.equal(Node.ELEMENT_NODE);
        });
        it('ignores white space between block elements', function() {
            var node = nodeFromXML('<section><div></div> <div></div></section>'),
            contents = node.contents();
            expect(contents).to.have.length(2);
            [0,1].forEach(function(idx) {
                expect(contents[idx].nodeType).to.equal(Node.ELEMENT_NODE);
            });
        });
        it('trims white space from the beginning and the end of the block elements', function() {
            var node = nodeFromXML('<section> Alice <span>has</span> a cat </section>');
            expect(node.contents()[0].getText()).to.equal('Alice ');
            expect(node.contents()[2].getText()).to.equal(' a cat');
        });
        it('normalizes string of white characters to one space at the inline element boundaries', function() {
            var node = nodeFromXML('<span>   Alice has a cat   </span>');
            expect(node.contents()[0].getText()).to.equal(' Alice has a cat ');
        });
        it('normalizes string of white characters to one space before inline element', function() {
            var node = nodeFromXML('<div>Alice has  <span>a cat</span></div>');
            expect(node.contents()[0].getText()).to.equal('Alice has ');
        });
        it('normalizes string of white characters to one space after inline element', function() {
            var node = nodeFromXML('<div>Alice has <span>a</span>  cat</div>');
            expect(node.contents()[2].getText()).to.equal(' cat');
        });
    });

    describe('formatting output xml', function() {

        /*jshint multistr: true */

        it('keeps white space between XML nodes', function() {
            var xmlIn = '<section>\n\n\n<div></div>\n\n\n<div></div>\n\n\n</section>',
            doc = getDocumentFromXML(xmlIn),
            xmlOut = doc.toXML();

            var partsIn = xmlIn.split('\n\n\n'),
                partsOut = xmlOut.split('\n\n\n');

            expect(partsIn).to.deep.equal(partsOut);
        });

        it('keeps white space between XML nodes - inline case', function() {
            var xmlIn = '<section>\n\n\n<span></span>\n\n\n<span></span>\n\n\n</section>',
                doc = getDocumentFromXML(xmlIn),
                xmlOut = doc.toXML();

            var partsIn = xmlIn.split('\n\n\n'),
                partsOut = xmlOut.split('\n\n\n');
            expect(partsIn).to.deep.equal(partsOut);
        });

        it('keeps white space at the beginning of text', function() {
            var xmlIn = '<section>    abc<div>some div</div>    abc</section>',
                doc = getDocumentFromXML(xmlIn),
                xmlOut = doc.toXML();

            expect(xmlOut).to.equal(xmlIn);
        });

        // it('nests new children block elements', function() {
        //     var doc = getDocumentFromXML('<section></section>');
    
        //     doc.root.append({tag: 'header'});

        //     var xmlOut = doc.toXML();
        //     expect(xmlOut.split('\n  ')[0]).to.equal('<section>', 'nesting start ok');
        //     expect(xmlOut.split('\n').slice(-1)[0]).to.equal('</section>', 'nesting end ok');

        // });

        // it('doesn\'t nest new children inline elements', function() {
        //     var doc = getDocumentFromXML('<section></section>');
    
        //     doc.root.append({tag: 'span'});

        //     var xmlOut = doc.toXML();
        //     expect(xmlOut).to.equal('<section><span></span></section>');
        // });

        it('keeps original white space at the end of text', function() {
            
            var xmlIn = '<header>    Some text ended with white space \
            \
            <span class="uri">Some text</span> some text\
        \
        </header>',
                doc = getDocumentFromXML(xmlIn),
                xmlOut = doc.toXML();
        
            expect(xmlOut).to.equal(xmlIn);
        });

        it('keeps white space around text node', function() {
            var xmlIn = '<section>\
            <header>header1</header>\
            Some text surrounded by white space\
            <header>header2</header>\
        </section>',
                doc = getDocumentFromXML(xmlIn),
                xmlOut = doc.toXML();
            expect(xmlOut).to.equal(xmlIn);
        });

        it('keeps white space around text node - last node case', function() {
            var xmlIn = '<section>\
            <header>header</header>\
                \
            Some text surrounded by white space\
                \
        </section>',
                doc = getDocumentFromXML(xmlIn),
                xmlOut = doc.toXML();

            expect(xmlOut).to.equal(xmlIn);
        });

        it('keeps white space after detaching text element', function() {
            var xmlIn = '<section><header>header</header>\n\
                \n\
            text1\n\
                \n\
        </section>',
                expectedXmlOut = '<section><header>header</header>\n\
                \n\
            \n\
                \n\
        </section>',
                doc = getDocumentFromXML(xmlIn),
                contents = doc.root.contents(),
                text = contents[contents.length-1];
            
            expect(text.getText()).to.equal('text1');

            text.detach();

            var xmlOut = doc.toXML();
            expect(xmlOut).to.equal(expectedXmlOut);
        });

    });

    describe('Extension', function() {
        var doc, extension, testClassNode;

        beforeEach(function() {
            doc = getDocumentFromXML('<section>Alice<div class="test_class"></div><div class="test_class.a"></div></section>');
        });

        it('allows adding method to an ElementNode of specific class', function() {
            extension = {wlxmlClass: {test_class: {methods: {
                testMethod: function() { return this; }
            }}}};
            doc.registerExtension(extension);
            testClassNode = doc.root.contents()[1];
            expect(testClassNode.object.testMethod().sameNode(testClassNode)).to.equal(true, '1');
        });

        it('allows adding non-function properties to an ElementNode of specific class', function() {
            extension = {wlxmlClass: {test_class: {methods: {
                testProp: 123
            }}}};
            doc.registerExtension(extension);
            testClassNode = doc.root.contents()[1];
            expect(testClassNode.object.testProp).to.equal(123);
        });

        it('allows adding transformation to an ElementNode of specific class', function() {
            extension = {wlxmlClass: {test_class: {transformations: {
                testTransformation: function() { return this; },
                testTransformation2: {impl: function() { return this; }}
            }}}};
            doc.registerExtension(extension);
            testClassNode = doc.root.contents()[1];
            expect(testClassNode.object.testTransformation().sameNode(testClassNode)).to.equal(true, '1');
            expect(testClassNode.object.testTransformation2().sameNode(testClassNode)).to.equal(true, '1');
        });

        it('added methods are inherited by nodes with subclasses', function() {
            extension = {wlxmlClass: {test_class: {methods: {
                testMethod: function() { return this; }
            }}}};
            doc.registerExtension(extension);
            testClassNode = doc.root.contents()[2];
            expect(testClassNode.object.testMethod().sameNode(testClassNode)).to.equal(true);
        });
        it('added transformations are inherited by nodes with subclasses', function() {
            extension = {wlxmlClass: {test_class: {transformations: {
                testTransformation: function() { return this; },
                testTransformation2: {impl: function() { return this; }}
            }}}};
            doc.registerExtension(extension);
            testClassNode = doc.root.contents()[2];
            expect(testClassNode.object.testTransformation().sameNode(testClassNode)).to.equal(true, '1');
            expect(testClassNode.object.testTransformation2().sameNode(testClassNode)).to.equal(true, '2');
        });
    });

    describe('Context roots', function() {
        var doc = getDocumentFromXML('<section><div class="a"><div class="b"><div class="c"></div></div></div></section>');
        doc.registerExtension({wlxmlClass: {a: {methods: {
            isContextRoot: function(node) {
                return node.getClass() === 'b';
            }
        }}}});

        var divA = doc.root.contents()[0],
            divB = divA.contents()[0],
            divC = divB.contents()[0];

        it('allows extensions declaring a node as a context root', function() {
            expect(divC.isContextRoot()).to.equal(false, 'c is not a context root');
            expect(divB.isContextRoot()).to.equal(true, 'b is a context root');
            expect(divA.isContextRoot()).to.equal(false, 'a is not a context root');
        });

        it('closes context for parent context quering methods', function() {
            expect(divC.isInside('b')).to.equal(true, 'c inside b');
            expect(divC.isInside('a')).to.equal(false, 'c not inside a');
            expect(divC.isInside({tagName: 'section'})).to.equal(false, 'c not inside section');

            expect(divB.isInside('a')).to.equal(true, 'b inside a');
            expect(divB.isInside({tagName: 'section'})).to.equal(true, 'b inside section');

            expect(divA.isInside({tagName: 'section'})).to.equal(true, 'a inside section');
        });
    });
});

});