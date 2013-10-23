define([
    'libs/chai',
    './wlxml.js'
], function(chai, wlxml) {
    
'use strict';

/* global it, describe */

var expect = chai.expect;

var nodeFromXML = function(xml) {
    return wlxml.WLXMLElementNodeFromXML(xml);
};

var getDocumentFromXML = function(xml) {
    return wlxml.WLXMLDocumentFromXML(xml);
};


describe('WLXMLDocument', function() {
    
    describe('Basic wlxml element node properties', function() {
        it('returns its class', function() {
            var node = nodeFromXML('<header class="class.subclass"></header>');
            expect(node.getClass()).to.equal('class.subclass');
        });

        it('returns its attributes as dict', function() {
            var node = nodeFromXML('<span meta-attr1="val1" meta-attr2="val2"></span>');
            expect(node.getMetaAttributes()).to.eql([{name: 'attr1', value: 'val1'}, {name: 'attr2', value: 'val2'}]);
        });

        it('returns attributes other than class and meta-* as other attributes', function() {
            var node = nodeFromXML('<span class="uri" meta-attr="val" attr1="val1" attr2="val2"></span>');
            expect(node.getOtherAttributes()).to.eql({attr1: 'val1', attr2: 'val2'});
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
            console.log(xmlIn);
            console.log(xmlOut);
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

});

});