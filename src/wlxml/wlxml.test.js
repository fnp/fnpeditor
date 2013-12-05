define([
    'libs/chai',
    './wlxml.js'
], function(chai, wlxml) {
    
'use strict';

/* jshint expr:true */
/* global it, describe */

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

        it('returns attributes other than class and meta-* as other attributes', function() {
            var node = nodeFromXML('<span class="uri" meta-attr="val" attr1="val1" attr2="val2"></span>');
            expect(node.getOtherAttributes()).to.eql({attr1: 'val1', attr2: 'val2'});
        });
    });

    describe('WLXML node meta attributes', function() {

        it('inherits keys from super classes', function() {
            var testClasses = {
                    '': {
                        attrs: {'common': {type: 'string'}}
                    },
                    'a': {
                        attrs: {'a_attr': {type: 'string'}}
                    },
                    'a.b': {
                        attrs: {'a_b_attr': {type: 'string'}}
                    },
                    'a.b.c': {
                        attrs: {'a_b_c_attr': {type: 'string'}}
                    }
                },
                doc = getDocumentFromXML('<section></section>', {wlxmlClasses: testClasses}),
                section = doc.root;

            expect(section.getMetaAttributes().keys()).to.eql(['common']);

            section.setClass('a');
            expect(section.getMetaAttributes().keys().sort()).to.eql(['common', 'a_attr'].sort());

            section.setClass('a.b');
            expect(section.getMetaAttributes().keys().sort()).to.eql(['common', 'a_attr', 'a_b_attr'].sort());

            section.setClass('a.b.c');
            expect(section.getMetaAttributes().keys().sort()).to.eql(['common', 'a_attr', 'a_b_attr', 'a_b_c_attr'].sort());
        });

        describe('api', function() {
            it('returns meta attributes as a dict', function() {
                var testClasses = {
                        'test': {
                            attrs: {
                                attr1: {type: 'string'},
                                attr2: {type: 'date'}
                            }
                        }
                    },
                    node = getDocumentFromXML(
                        '<span class="test" meta-attr1="val1" meta-attr2="2014-01-01"></span>',
                        {wlxmlClasses: testClasses}
                    ).root,
                    attrs = node.getMetaAttributes();

                expect(attrs.keys().sort()).to.eql(['attr1', 'attr2'].sort());
                expect(attrs.attr1.value).to.equal('val1');
                expect(attrs.attr1.type).to.equal('string');
                expect(attrs.attr2.value).to.equal('2014-01-01');
                expect(attrs.attr2.type).to.equal('date');
            });
            it('returns undefined value if attribute is missing', function() {
                var testClasses = {
                        'test': {
                            attrs: {
                                attr1: {type: 'string'},
                            }
                        }
                    },
                    node = getDocumentFromXML('<span class="test"></span>', {wlxmlClasses: testClasses}).root,
                    attrs = node.getMetaAttributes();
                    expect(attrs.attr1.value).to.be.undefined;
            });
        });
    });

    describe('White space handling', function() {
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
        it('normalizes string of white characters to one space at the inline element boundries', function() {
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
        var doc, extension, elementNode, textNode, testClassNode;

        beforeEach(function() {
            doc = getDocumentFromXML('<section>Alice<div class="test_class"></div></section>');
            elementNode = doc.root;
            textNode = doc.root.contents()[0];
            extension = {};
            

            // spr+ a expect dotyczacy object api?
        });

        it('allows adding method to an ElementNode of specific class', function() {
            extension = {wlxmlClass: {test_class: {methods: {
                testMethod: function() { return this; }
            }}}};
            doc.registerExtension(extension);
            testClassNode = doc.root.contents()[1];
            expect(testClassNode.object.testMethod().sameNode(testClassNode)).to.equal(true, '1');
        });

        it('allows adding transformation to an ElementNode of specific class', function() {
            extension = {wlxmlClass: {test_class: {transformations: {
                testTransformation: function() { return this; },
                testTransformation2: {impl: function() { return this; }}
            }}}};
            doc.registerExtension(extension);
            testClassNode = doc.root.contents()[1];
            expect(testClassNode.object.transform('testTransformation').sameNode(testClassNode)).to.equal(true, '1');
            expect(testClassNode.object.transform('testTransformation2').sameNode(testClassNode)).to.equal(true, '1');
        });


    });

});

});