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

        describe('DocumentElement', function() {
            it('knows index of its child', function() {
                var c = canvas.fromXML('<section><div></div><header></header><span></span></section>'),
                    root = c.doc(),
                    child = root.children()[1];
                expect(root.childIndex(child)).to.equal(1);
            });
        });
    });

    describe('document representation api', function() {
        describe('document root element', function() {
            var c = canvas.fromXML('<section></section>');
            it('exists', function() {
                expect(c.doc()).to.be.instanceOf(documentElement.DocumentElement);
            });
            it('is of type DocumentNodeElement', function() {
                expect(c.doc()).to.be.instanceOf(documentElement.DocumentNodeElement);
            });
        });

        describe('DocumentElements comparison', function() {
            it('reports dwo DocumentElements to be the same when they represent the same wlxml document element', function() {
                var c = canvas.fromXML('<section><div></div><div></div></section>'),
                    first_div1 = c.doc().children()[0],
                    first_div2 = c.doc().children()[0],
                    second_div = c.doc().children()[1];
                expect(first_div1.sameNode(first_div1)).to.be.true;
                expect(first_div1.sameNode(first_div2)).to.be.true;
                expect(first_div1.sameNode(second_div)).to.be.false;
            });
        });

        describe('traversing', function() {
            it('reports element nodes', function() {
                var c = canvas.fromXML('<section><div></div></section>'),
                    children = c.doc().children();
                expect(children.length).to.equal(1);
                expect(children[0]).to.be.instanceOf(documentElement.DocumentNodeElement);

                c = canvas.fromXML('<section><div></div><div></div></section>'),
                    children = c.doc().children();
                expect(children.length).to.equal(2);
                expect(children[0]).to.be.instanceOf(documentElement.DocumentNodeElement);
                expect(children[1]).to.be.instanceOf(documentElement.DocumentNodeElement);
            });
            
            it('reports text nodes', function() {
                var c = canvas.fromXML('<section>Alice</section>'),
                    children = c.doc().children();
                expect(children.length).to.equal(1);
                expect(children[0]).to.be.instanceOf(documentElement.DocumentTextElement);
            });

            describe('accessing parents', function() {
                it('returns DocumentNodeElement representing parent in wlxml document as DocumentNodeElement parent', function() {
                    var c = canvas.fromXML('<section><div></div></section>'),
                        div = c.doc().children()[0];
                    expect(div.parent().sameNode(c.doc())).to.be.true;
                });
                it('returns DocumentNodeElement representing parent in wlxml document as DocumentTextElement parent', function() {
                    var c = canvas.fromXML('<section>Alice</section>'),
                        text = c.doc().children()[0];
                    expect(text.parent().sameNode(c.doc())).to.be.true;
                });
            });

            describe('free text handling', function() {
                    it('sees free text', function() {
                        var c = canvas.fromXML('<section>Alice <span>has</span> a cat</section>'),
                            children = c.doc().children();
                        expect(children.length).to.equal(3);
                        expect(children[0]).to.be.instanceOf(documentElement.DocumentTextElement);
                        expect(children[1]).to.be.instanceOf(documentElement.DocumentNodeElement);
                        expect(children[2]).to.be.instanceOf(documentElement.DocumentTextElement);
                    });
            });
            
            describe('white characters handling', function() {
                it('says empty element node has no children', function() {
                    var c = canvas.fromXML('<section></section>');
                    expect(c.doc().children().length).to.equal(0);
                });
                it('says element node with one space has one DocumentTextElement', function() {
                    var c = canvas.fromXML('<section> </section>');
                    expect(c.doc().children().length).to.equal(1);
                    expect(c.doc().children()[0]).to.be.instanceOf(documentElement.DocumentTextElement);
                });
                it('ignores white space surrounding block elements', function() {
                    var c = canvas.fromXML('<section> <div></div> </section>');
                    var children = c.doc().children();
                    expect(children.length).to.equal(1);
                    expect(children[0]).to.be.instanceOf(documentElement.DocumentNodeElement);
                });
                it('ignores white space between block elements', function() {
                    var c = canvas.fromXML('<section><div></div> <div></div></section>');
                    var children = c.doc().children();
                    expect(children.length === 2);
                    [0,1].forEach(function(idx) {
                        expect(children[idx]).to.be.instanceOf(documentElement.DocumentNodeElement);
                    });
                });
            });
        });

        describe('manipulation api', function() {

            describe('Basic Element inserting', function() {
                it('can put new NodeElement at the end', function() {
                    var c = canvas.fromXML('<section></section>'),
                        appended = c.doc().append({tag: 'header', klass: 'some.class'}),
                        children = c.doc().children();

                    expect(children.length).to.equal(1);
                    expect(children[0].sameNode(appended));
                });

                it('can put new NodeElement after another NodeElement', function() {
                    var c = canvas.fromXML('<section><div></div></section>'),
                        div = c.doc().children()[0],
                        added = div.after({tag: 'header', klass: 'some.class'}),
                        children = c.doc().children();
                    expect(children.length).to.equal(2);
                    expect(children[1].sameNode(added));
                });

                it('can put new Nodeelement before another element', function() {
                    var c = canvas.fromXML('<section><div></div></section>'),
                        div = c.doc().children()[0],
                        added = div.before({tag: 'header', klass: 'some.class'}),
                        children = c.doc().children();
                    expect(children.length).to.equal(2);
                    expect(children[0].sameNode(added));
                });
            });

            describe('wrapping', function() {
                it('wraps DocumentNodeElement', function() {
                    var c = canvas.fromXML('<section><div></div></section>'),
                        div = c.doc().children()[0];
                    
                    var returned = div.wrapWithNodeElement({tag: 'header', klass: 'some.class'}),
                        parent = div.parent(),
                        parent2 = c.doc().children()[0];

                    expect(returned.sameNode(parent)).to.be.true;
                    expect(returned.sameNode(parent2)).to.be.true;
                });
                it('wraps DocumentTextElement', function() {
                    var c = canvas.fromXML('<section>Alice</section>'),
                        text = c.doc().children()[0];
                    
                    var returned = text.wrapWithNodeElement({tag: 'header', klass: 'some.class'}),
                        parent = text.parent(),
                        parent2 = c.doc().children()[0];

                    expect(returned.sameNode(parent)).to.be.true;
                    expect(returned.sameNode(parent2)).to.be.true;
                });
            });
        });

    });
});


});