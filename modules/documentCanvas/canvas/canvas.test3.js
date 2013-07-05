define([
'libs/chai',
'modules/documentCanvas/canvas/canvas',
'modules/documentCanvas/canvas/documentElement'
], function(chai, canvas, documentElement) {
    
'use strict';

var expect = chai.expect;

describe('Canvas', function() {
    describe('basic properties', function() {
        it('renders empty document when canvas created from empty XML', function() {
            var c = canvas.fromXML('');
            expect(c.doc()).to.equal(null);
        });

        it('gives access to its document root node', function() {
            var c = canvas.fromXML('<section></section>');
            expect(c.doc().wlxmlTag).to.equal('section');
        });
    });

    describe('document api', function() {
        describe('document root element', function() {
            var c = canvas.fromXML('<section></section>');
            it('exists', function() {
                expect(c.doc()).to.be.instanceOf(documentElement.DocumentElement);
            });
            it('is of type DocumentNodeElement', function() {
                expect(c.doc()).to.be.instanceOf(documentElement.DocumentNodeElement);
            });
        });

        it('a', function() {
            var c = canvas.fromXML('<section><div></div></section>'),
                children = c.doc().children();
            expect(children.length).to.equal(3);
            expect(children[0]).to.be.instanceOf(documentElement.DocumentTextElement);
            expect(children[1]).to.be.instanceOf(documentElement.DocumentNodeElement);
            expect(children[2]).to.be.instanceOf(documentElement.DocumentTextElement);
        });

    });
});

/*describe('Canvas', function() {
    it('can wrap selected document nodes in a list', function() {
        var c = canvas.fromXML('\
            <section>\
                <div>Alice</div>\
                <div>has</div>\
                <div>a cat</div>\
            </section>
        ');
        var div_alice   = c.doc().children({tag: 'div'})[0];
        var div_cat     = c.doc().children({tag: 'div'})[2];
        c.doc.wrapInList({start: div_alice, end: div_cat});

        expect(c.doc().children().length === 3)


    })
});*/




});