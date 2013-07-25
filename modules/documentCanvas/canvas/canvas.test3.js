define([
'libs/chai',
'libs/sinon',
'modules/documentCanvas/canvas/canvas',
'modules/documentCanvas/canvas/documentElement'
], function(chai, sinon, canvas, documentElement) {
    
'use strict';

var expect = chai.expect;


describe('Canvas', function() {

    describe('Internal HTML representation of a sample document', function() {
        it('works', function() {
            var c = canvas.fromXML('\
                <section>\
                    This is some text without its own wrapping tag.\
                    <div class="p.subclass">\
                        This is a paragraph.\
                    </div>\
                    <div>\
                        This is text in a div <span>with some inline text</span>.\
                    </div>\
                    This is some text without its own wrapping tag.\
                </section>\
            ');
            var expected = '<div wlxml-tag="section">'
                            + '<div wlxml-text>This is some text without its own wrapping tag.</div>'
                            + '<div wlxml-tag="div" wlxml-class="p-subclass">'
                            +   '<div wlxml-text>This is a paragraph.</div>'
                            + '</div>'
                            + '<div wlxml-tag="div">'
                            +   '<div wlxml-text>This is text in a div </div>'
                            +   '<div wlxml-tag="span">'
                            +       '<div wlxml-text>with some inline text</div>'
                            +   '</div>'
                            +   '<div wlxml-text>.</div>'
                            + '</div>'
                            + '<div wlxml-text>This is some text without its own wrapping tag.</div>'
                            + '</div>';
            expect(c.doc().dom()[0].isEqualNode($(expected)[0])).to.be.true;
        });
    });

    describe('Internal HTML representation of a DocumentNodeElement', function() {
        it('is always a div tag', function() {
            ['section', 'header', 'span', 'aside', 'figure'].forEach(function(tagName) {
                var dom = canvas.fromXML('<' + tagName + '></' + tagName + '>').doc().dom();
                expect(dom.prop('tagName')).to.equal('DIV', tagName + ' is represented as div');
            });
        });
        it('has wlxml tag put into wlxml-tag attribute', function() {
            var dom = canvas.fromXML('<section></section>').doc().dom();
            expect(dom.attr('wlxml-tag')).to.equal('section');
        });
        it('has wlxml class put into wlxml-class, dots replaced with dashes', function() {
            var dom = canvas.fromXML('<section class="some.class"></section>').doc().dom();
            expect(dom.attr('wlxml-class')).to.equal('some-class');
        });
    });

    describe('Internal HTML representation of a DocumentTextElement', function() {
        it('is text node wrapped in a div with wlxml-text attribute set', function() {
            var dom = canvas.fromXML('<section>Alice</section>').doc().children()[0].dom();
            expect(dom.prop('tagName')).to.equal('DIV');
            expect(dom.attr('wlxml-text')).to.equal('');
            expect(dom.contents().length).to.equal(1);
            expect(dom.contents()[0].nodeType).to.equal(Node.TEXT_NODE);
            expect($(dom.contents()[0]).text()).to.equal('Alice');
        });
    });

    describe('basic properties', function() {
        it('renders empty document when canvas created from empty XML', function() {
            var c = canvas.fromXML('');
            expect(c.doc()).to.equal(null);
        });

        it('gives access to its document root node', function() {
            var c = canvas.fromXML('<section></section>');
            expect(c.doc().getWlxmlTag()).to.equal('section');
        });

        describe('root element', function() {
            it('has no parent', function() {
                var c = canvas.fromXML('<section></section>');
                expect(c.doc().parent()).to.be.null;
            });
        });

        describe('DocumentTextElement', function() {
            it('can have its content set', function() {
                var c = canvas.fromXML('<section>Alice</section>'),
                    root = c.doc(),
                    text = root.children()[0];
                
                text.setText('a cat');
                expect(root.children()[0].getText()).to.equal('a cat');
            });
        });

        describe('DocumentNodeElement', function() {
            it('knows index of its child', function() {
                var c = canvas.fromXML('<section><div></div><header></header><span></span></section>'),
                    root = c.doc(),
                    child = root.children()[1];
                expect(root.childIndex(child)).to.equal(1);
            });

            it('knows WLXML tag it renders', function(){
                var c = canvas.fromXML('<section></section>'),
                    section = c.doc();
                expect(section.getWlxmlTag()).to.equal('section', 'initial tag is section');
                section.setWlxmlTag('header');
                expect(section.getWlxmlTag()).to.equal('header', 'tag is changed to header');
            });

            it('knows WLXML class of a WLXML tag it renders', function(){
                var c = canvas.fromXML('<section class="some.class.A"></section>'),
                    section = c.doc();
                expect(section.getWlxmlClass()).to.equal('some.class.A');
                section.setWlxmlClass('some.class.B');
                expect(section.getWlxmlClass()).to.equal('some.class.B');
                section.setWlxmlClass(null);
                expect(section.getWlxmlClass()).to.be.undefined;
            });



            describe('element has meta attributes', function() {
                it('can change its meta attributes', function() {
                    var c = canvas.fromXML('<section><span class="uri" meta-uri="someuri"></span></section>'),
                    span = c.doc().children()[0];
                    
                    expect(span.getWlxmlMetaAttr('uri')).to.equal('someuri');
                    span.setWlxmlMetaAttr('uri', 'otheruri');
                    expect(span.getWlxmlMetaAttr('uri')).to.equal('otheruri');
                });

                it('changes its meta attributes with class change', function() {
                    var c = canvas.fromXML('<section><span class="uri" meta-uri="someuri"></span></section>'),
                    span = c.doc().children()[0];
                    
                    expect(span.getWlxmlMetaAttr('uri')).to.equal('someuri');
                    span.setWlxmlClass('author');
                    expect(span.getWlxmlMetaAttr('uri')).to.be.undefined;
                });

                it('keeps meta attribute value on class change if a new class has this attribute', function() {
                    var c = canvas.fromXML('<section><span class="uri" meta-uri="someuri"></span></section>'),
                    span = c.doc().children()[0];
                    span.setWlxmlClass('uri.some.subclass');
                    expect(span.getWlxmlMetaAttr('uri')).to.equal('someuri');
                });
            });
        });

        it('returns DocumentNodeElement instance from HTMLElement', function() {
            var c = canvas.fromXML('<section></section>'),
                htmlElement = c.doc().dom().get(0),
                element = c.getDocumentElement(htmlElement);
            expect(element).to.be.instanceOf(documentElement.DocumentNodeElement);
            expect(element.sameNode(c.doc()));
        });
        
        it('returns DocumentTextElement instance from Text Node', function() {
            var c = canvas.fromXML('<section>Alice</section>'),
                aliceElement = c.doc().children()[0],
                textNode = aliceElement.dom().contents()[0],
                element = c.getDocumentElement(textNode);

            expect(textNode.nodeType).to.equal(Node.TEXT_NODE, 'text node selected');
            expect($(textNode).text()).to.equal('Alice');

            expect(element).to.be.instanceOf(documentElement.DocumentTextElement);
            expect(element.sameNode(c.doc().children()[0]));
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
                    expect(c.doc().children()[0].getText()).to.equal(' ');
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

                it('trims white space from the beginning and the end of the block elements', function() {
                    var c = canvas.fromXML('<section> Alice <span>has</span> a cat </section>');
                    expect(c.doc().children()[0].getText()).to.equal('Alice ');
                    expect(c.doc().children()[2].getText()).to.equal(' a cat');
                });

                it('normalizes string of white characters to one space at the inline element boundries', function() {
                    var c = canvas.fromXML('<span>   Alice has a cat   </span>');
                    expect(c.doc().children()[0].getText()).to.equal(' Alice has a cat ');
                });

                it('normalizes string of white characters to one space before inline element', function() {
                    var c = canvas.fromXML('<div>Alice has  <span>a cat</span></div>');
                    expect(c.doc().children()[0].getText()).to.equal('Alice has ');
                });
                
                it('normalizes string of white characters to one space after inline element', function() {
                    var c = canvas.fromXML('<div>Alice has <span>a</span>  cat</div>');
                    expect(c.doc().children()[2].getText()).to.equal(' cat');
                });
            });

            describe('getting vertically first text element', function() {
                it('returns the first child if it\'s text element, ignores metadata', function() {
                    var c = canvas.fromXML('<section><metadata><dc:author>author</dc:author></metadata>Alice<div>has</div>a cat</section>'),
                        first = c.doc().getVerticallyFirstTextElement();

                    expect(first.sameNode(c.doc().children()[1])).to.be.true;
                });

                it('looks recursively inside node elements if they precede text element', function() {
                    var c = canvas.fromXML('\
                            <section>\
                                <div>\
                                    <div>\
                                        Alice\
                                    </div>\
                                </div>\
                                Some text\
                            </section>'),
                        textAlice = c.doc().children()[0].children()[0].children()[0],
                        first = c.doc().getVerticallyFirstTextElement();

                    expect(textAlice).to.be.instanceOf(documentElement.DocumentTextElement);
                    expect(first.sameNode(textAlice)).to.be.true;
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
                    expect(children[0].sameNode(appended)).to.be.true;
                });

                it('can put new TextElement at the end', function() {
                    var c = canvas.fromXML('<section></section>'),
                        appended = c.doc().append({text: 'Alice'}),
                        children = c.doc().children();

                    expect(children.length).to.equal(1);
                    expect(children[0].sameNode(appended)).to.be.true;
                    expect(children[0].getText()).to.equal('Alice');
                });

                it('can put new NodeElement after another NodeElement', function() {
                    var c = canvas.fromXML('<section><div></div></section>'),
                        div = c.doc().children()[0],
                        added = div.after({tag: 'header', klass: 'some.class'}),
                        children = c.doc().children();
                    expect(children.length).to.equal(2);
                    expect(children[1].sameNode(added)).to.be.true;
                });

                it('can put new Nodeelement before another element', function() {
                    var c = canvas.fromXML('<section><div></div></section>'),
                        div = c.doc().children()[0],
                        added = div.before({tag: 'header', klass: 'some.class'}),
                        children = c.doc().children();
                    expect(children.length).to.equal(2);
                    expect(children[0].sameNode(added)).to.be.true;
                });

                it('can put new DocumentNodeElement after DocumentTextElement', function() {
                    var c = canvas.fromXML('<section>Alice</section>'),
                        text = c.doc().children()[0],
                        added = text.after({tag: 'p'}),
                        children = c.doc().children();

                    expect(children.length).to.equal(2);
                    expect(children[0]).to.be.instanceOf(documentElement.DocumentTextElement);
                    expect(children[0].getText()).to.equal('Alice');
                    expect(children[1]).to.be.instanceOf(documentElement.DocumentNodeElement);
                    expect(children[1].sameNode(added)).to.be.true;
                });
                it('can put new DocumentNodeElement before DocumentTextElement', function() {
                    var c = canvas.fromXML('<section>Alice</section>'),
                        text = c.doc().children()[0],
                        added = text.before({tag: 'p'}),
                        children = c.doc().children();

                    expect(children.length).to.equal(2);
                    expect(children[0]).to.be.instanceOf(documentElement.DocumentNodeElement);
                    expect(children[0].sameNode(added)).to.be.true;
                    expect(children[1]).to.be.instanceOf(documentElement.DocumentTextElement);
                    expect(children[1].getText()).to.equal('Alice');
                });
            });

            describe('Splitting text', function() {
                
                it('splits DocumentTextElement\'s parent into two DocumentNodeElements of the same type', function() {
                    var c = canvas.fromXML('<section><header>Some header</header></section>'),
                        section = c.doc(),
                        text = section.children()[0].children()[0];

                    var returnedValue = text.split({offset: 5});
                    expect(section.children().length).to.equal(2, 'section has two children');
                    
                    var header1 = section.children()[0];
                    var header2 = section.children()[1];

                    expect(header1.getWlxmlTag()).to.equal('header', 'first section child represents wlxml header');
                    expect(header1.children().length).to.equal(1, 'first header has one text child');
                    expect(header1.children()[0].getText()).to.equal('Some ', 'first header has correct content');
                    expect(header2.getWlxmlTag()).to.equal('header', 'second section child represents wlxml header');
                    expect(header2.children().length).to.equal(1, 'second header has one text child');
                    expect(header2.children()[0].getText()).to.equal('header', 'second header has correct content');

                    expect(returnedValue.first.sameNode(header1)).to.equal(true, 'first node returnde');
                    expect(returnedValue.second.sameNode(header2)).to.equal(true, 'second node returned');
                });

                it('leaves empty copy of DocumentNodeElement if splitting at the very beginning', function() {
                        var c = canvas.fromXML('<section><header>Some header</header></section>'),
                        section = c.doc(),
                        text = section.children()[0].children()[0];

                        text.split({offset: 0});
                        
                        var header1 = section.children()[0];
                        var header2 = section.children()[1];

                        expect(header1.children().length).to.equal(0);
                        expect(header2.children()[0].getText()).to.equal('Some header');
                });

                it('leaves empty copy of DocumentNodeElement if splitting at the very end', function() {
                        var c = canvas.fromXML('<section><header>Some header</header></section>'),
                        section = c.doc(),
                        text = section.children()[0].children()[0];

                        text.split({offset: 11});
                        
                        var header1 = section.children()[0];
                        var header2 = section.children()[1];

                        expect(header1.children()[0].getText()).to.equal('Some header');
                        expect(header2.children().length).to.equal(0);
                });

                it('keeps DocumentTextElement\'s parent\'s children elements intact', function() {
                    var c = canvas.fromXML('\
                            <section>\
                                <header>\
                                    A <span>fancy</span> and <span>nice</span> header\
                                </header>\
                            </section>'),
                        section = c.doc(),
                        header = section.children()[0],
                        textAnd = header.children()[2];

                    textAnd.split({offset: 2});
                    
                    var sectionChildren = section.children();
                    expect(sectionChildren.length).to.equal(2, 'Section has two children');
                    expect(sectionChildren[0].getWlxmlTag()).to.equal('header', 'First section element is a wlxml header');
                    expect(sectionChildren[1].getWlxmlTag()).to.equal('header', 'Second section element is a wlxml header');

                    var firstHeaderChildren = sectionChildren[0].children();
                    expect(firstHeaderChildren.length).to.equal(3, 'First header has three children');
                    expect(firstHeaderChildren[0].getText()).to.equal('A ', 'First header starts with a text');
                    expect(firstHeaderChildren[1].getWlxmlTag()).to.equal('span', 'First header has span in the middle');
                    expect(firstHeaderChildren[2].getText()).to.equal(' a', 'First header ends with text');

                    var secondHeaderChildren = sectionChildren[1].children();
                    expect(secondHeaderChildren.length).to.equal(3, 'Second header has three children');
                    expect(secondHeaderChildren[0].getText()).to.equal('nd ', 'Second header starts with text');
                    expect(secondHeaderChildren[1].getWlxmlTag()).to.equal('span', 'Second header has span in the middle');
                    expect(secondHeaderChildren[2].getText()).to.equal(' header', 'Second header ends with text');
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
                    expect(returned.getWlxmlTag()).to.equal('header');
                    expect(returned.getWlxmlClass()).to.equal('some.class');
                });
                it('wraps DocumentTextElement', function() {
                    var c = canvas.fromXML('<section>Alice</section>'),
                        text = c.doc().children()[0];
                    
                    var returned = text.wrapWithNodeElement({tag: 'header', klass: 'some.class'}),
                        parent = text.parent(),
                        parent2 = c.doc().children()[0];

                    expect(returned.sameNode(parent)).to.be.true;
                    expect(returned.sameNode(parent2)).to.be.true;
                    expect(returned.getWlxmlTag()).to.equal('header');
                    expect(returned.getWlxmlClass()).to.equal('some.class');
                });
                
                describe('wrapping part of DocumentTextElement', function() {
                    [{start: 5, end: 12}, {start: 12, end: 5}].forEach(function(offsets) {
                        it('wraps in the middle ' + offsets.start + '/' + offsets.end, function() {
                            var c = canvas.fromXML('<section>Alice has a cat</section>'),
                                text = c.doc().children()[0];
                            
                            var returned = text.wrapWithNodeElement({tag: 'header', klass: 'some.class', start: offsets.start, end: offsets.end}),
                                children = c.doc().children();

                            expect(children.length).to.equal(3);
                            
                            expect(children[0]).to.be.instanceOf(documentElement.DocumentTextElement);
                            expect(children[0].getText()).to.equal('Alice');

                            expect(children[1].sameNode(returned)).to.be.true;
                            expect(returned.getWlxmlTag()).to.equal('header');
                            expect(returned.getWlxmlClass()).to.equal('some.class');
                            expect(children[1].children().length).to.equal(1);
                            expect(children[1].children()[0].getText()).to.equal(' has a ');

                            expect(children[2]).to.be.instanceOf(documentElement.DocumentTextElement);
                            expect(children[2].getText()).to.equal('cat');
                        });
                    });

                    it('wraps whole text inside DocumentTextElement if offsets span entire content', function() {
                         var c = canvas.fromXML('<section>Alice has a cat</section>'),
                             text = c.doc().children()[0];
                         
                         var returned = text.wrapWithNodeElement({tag: 'header', klass: 'some.class', start: 0, end: 15}),
                             children = c.doc().children();

                         expect(children.length).to.equal(1);
                         expect(children[0]).to.be.instanceOf(documentElement.DocumentNodeElement);
                         expect(children[0].children()[0].getText()).to.equal('Alice has a cat');
                    });
                });

                it('wraps text spanning multiple sibling DocumentTextNodes', function() {
                    var c = canvas.fromXML('<section>Alice has a <span>small</span> cat</section>'),
                        section = c.doc(),
                        wrapper = c.wrapText({
                            inside: section, 
                            _with: {tag: 'span', klass: 'some.class'},
                            offsetStart: 6,
                            offsetEnd: 4,
                            textNodeIdx: [0,2]
                        });

                    expect(section.children().length).to.equal(2);
                    expect(section.children()[0]).to.be.instanceOf(documentElement.DocumentTextElement);
                    expect(section.children()[0].getText()).to.equal('Alice ');

                    var wrapper2 = section.children()[1];
                    expect(wrapper2.sameNode(wrapper)).to.be.true;

                    var wrapperChildren = wrapper.children();
                    expect(wrapperChildren.length).to.equal(3);
                    expect(wrapperChildren[0].getText()).to.equal('has a ');

                    expect(wrapperChildren[1]).to.be.instanceOf(documentElement.DocumentNodeElement);
                    expect(wrapperChildren[1].children().length).to.equal(1);
                    expect(wrapperChildren[1].children()[0].getText()).to.equal('small');

                    expect(wrapperChildren[2].getText()).to.equal(' cat');
                });
            });

            describe('unwrapping', function() {
                it('unwraps DocumentTextElement from its parent DocumentNodeElement if it\'s its only child', function() {
                    var c = canvas.fromXML('<section>Alice <span>has a</span> cat</section>'),
                    section = c.doc(),
                    text = section.children()[1].children()[0];

                    var newTextContainer = text.unwrap();

                    expect(section.children().length).to.equal(1, 'section has one child');
                    expect(section.children()[0].getText()).to.equal('Alice has a cat');
                    expect(newTextContainer.sameNode(c.doc())).to.equal(true, 'unwrap returns new text parent DocumentNodeElement');
                })
            });
        });

        describe('Lists api', function() {
            describe('creating lists', function() {
                it('allows creation of a list from existing sibling DocumentElements', function() {
                    var c = canvas.fromXML('\
                        <section>\
                            Alice\
                            <div>has</div>\
                            a\
                            <div>cat</div>\
                        </section>'),
                        section = c.doc(),
                        textHas = section.children()[1],
                        divA = section.children()[2]
                    
                    c.list.create({element1: textHas, element2: divA});

                    expect(section.children().length).to.equal(3, 'section has three child elements');

                    var child1 = section.children()[0],
                        list = section.children()[1],
                        child3 = section.children()[2];

                    expect(child1.getText()).to.equal('Alice');
                    expect(list.is('list')).to.equal(true, 'second child is a list');
                    expect(list.children().length).to.equal(2, 'list contains two elements');
                    list.children().forEach(function(child) {
                        expect(child.getWlxmlClass()).to.equal('item', 'list childs have wlxml class of item');
                    });
                    expect(child3.children()[0].getText()).to.equal('cat');
                });
                
                it('allows creating nested list from existing sibling list items', function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list-items">\
                                <div class="item">A</div>\
                                <div class="item">B</div>\
                                <div class="item">C</div>\
                                <div class="item">D</div>\
                            </div>\
                        </section>'),
                        outerList = c.doc().children()[0],
                        itemB = outerList.children()[1],
                        itemC = outerList.children()[2];


                        c.list.create({element1: itemB, element2: itemC});

                    var outerListItems = outerList.children(),
                        innerList = outerListItems[1].children()[0],
                        innerListItems = innerList.children();

                    expect(outerListItems.length).to.equal(3, 'outer list has three items');
                    expect(outerListItems[0].children()[0].getText()).to.equal('A', 'first outer item ok');
                    expect(outerListItems[1].getWlxmlClass()).to.equal('item', 'inner list is wrapped by item element');

                    expect(innerList.is('list')).to.equal(true, 'inner list created');
                    expect(innerListItems.length).to.equal(2, 'inner list has two items');
                    expect(innerListItems[0].children()[0].getText()).to.equal('B', 'first inner item ok');
                    expect(innerListItems[1].children()[0].getText()).to.equal('C', 'second inner item ok');

                    expect(outerListItems[2].children()[0].getText()).to.equal('D', 'last outer item ok');

                });

            });

            describe('extracting list items', function() {
                it('creates two lists with extracted items in the middle if extracting from the middle of the list', function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list.items">\
                                <div class="item">0</div>\
                                <div class="item">1</div>\
                                <div class="item">2</div>\
                                <div class="item">3</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        item1 = list.children()[1],
                        item2 = list.children()[2];

                    c.list.extractItems({element1: item1, element2: item2});

                    var section = c.doc(),
                        list1 = section.children()[0],
                        oldItem1 = section.children()[1],
                        oldItem2 = section.children()[2],
                        list2 = section.children()[3];

                    expect(section.children().length).to.equal(4, 'section contains four children');
                    
                    expect(list1.is('list')).to.equal(true, 'first section child is a list');
                    expect(list1.children().length).to.equal(1, 'first list has one child');
                    expect(list1.children()[0].children()[0].getText()).to.equal('0', 'first item of the first list is a first item of the original list');

                    expect(oldItem1.children()[0].getText()).to.equal('1', 'first item got extracted');
                    expect(oldItem1.getWlxmlClass() === undefined).to.equal(true, 'first extracted element has no wlxml class');

                    expect(oldItem2.children()[0].getText()).to.equal('2', 'second item got extracted');
                    expect(oldItem2.getWlxmlClass() === undefined).to.equal(true, 'second extracted element has no wlxml class');

                    expect(list2.is('list')).to.equal(true, 'last section child is a list');
                    expect(list2.children().length).to.equal(1, 'second list has one child');
                    expect(list2.children()[0].children()[0].getText()).to.equal('3', 'first item of the second list is a last item of the original list');
                });

                it('puts extracted items above the list if starting item is the first one', function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list.items">\
                                <div class="item">0</div>\
                                <div class="item">1</div>\
                                <div class="item">2</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        item1 = list.children()[0],
                        item2 = list.children()[1],
                        item3 = list.children()[2];

                    c.list.extractItems({element1: item1, element2: item2});

                    var section = c.doc(),
                        oldItem1 = section.children()[0],
                        oldItem2 = section.children()[1],
                        newList = section.children()[2];

                    expect(section.children().length).to.equal(3, 'section has three children');
                    expect(oldItem1.children()[0].getText()).to.equal('0', 'first item extracted');
                    expect(oldItem2.children()[0].getText()).to.equal('1', 'second item extracted');
                    expect(newList.is('list')).to.equal(true, 'list lies below extracted item');
                    expect(newList.children().length).to.equal(1, 'list has now one child');
                });

                it('puts extracted items below the list if ending item is the last one', function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list.items">\
                                <div class="item">0</div>\
                                <div class="item">1</div>\
                                <div class="item">2</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        item1 = list.children()[0],
                        item2 = list.children()[1],
                        item3 = list.children()[2];

                    c.list.extractItems({element1: item2, element2: item3});

                    var section = c.doc(),
                        oldItem1 = section.children()[1],
                        oldItem2 = section.children()[2],
                        newList = section.children()[0];

                    expect(section.children().length).to.equal(3, 'section has three children');
                    expect(oldItem1.children()[0].getText()).to.equal('1', 'first item extracted');
                    expect(oldItem2.children()[0].getText()).to.equal('2', 'second item extracted');
                    expect(newList.is('list')).to.equal(true, 'list lies above extracted item');
                    expect(newList.children().length).to.equal(1, 'list has now one child');
                });

                it('removes list if all its items are extracted', function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list.items">\
                                <div class="item">some item</div>\
                                <div class="item">some item 2</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        item1 = list.children()[0],
                        item2 = list.children()[1];

                    c.list.extractItems({element1: item1, element2: item2});

                    var section = c.doc(),
                        list1 = section.children()[0],
                        oldItem1 = section.children()[0],
                        oldItem2 = section.children()[1];

                    expect(section.children().length).to.equal(2, 'section contains two children');
                    expect(oldItem1.children()[0].getText()).to.equal('some item');
                    expect(oldItem2.children()[0].getText()).to.equal('some item 2');
                });

                it('creates two lists with extracted items in the middle if extracting from the middle of the list - nested case' , function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list.items">\
                                <div class="item">0</div>\
                                <div class="item">\
                                    <div class="list.items">\
                                        <div class="item">1.1</div>\
                                        <div class="item">1.2</div>\
                                        <div class="item">1.3</div>\
                                    </div>\
                                </div>\
                                <div class="item">2</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        nestedList = list.children()[1].children()[0],
                        nestedListItem = nestedList.children()[1];

                    c.list.extractItems({element1: nestedListItem, element2: nestedListItem});

                    var section = c.doc(),
                        list = section.children()[0],
                        item1 = list.children()[0],
                        item2 = list.children()[1], //
                        item3 = list.children()[2],
                        item4 = list.children()[3], //
                        item5 = list.children()[4],
                        nestedList1 = item2.children()[0],
                        nestedList2 = item4.children()[0];

                    expect(list.children().length).to.equal(5, 'top list has five items');
                    
                    expect(item1.children()[0].getText()).to.equal('0', 'first item ok');

                    expect(item2.getWlxmlClass()).to.equal('item', 'first nested list is still wrapped in item element');
                    expect(nestedList1.children().length).to.equal(1, 'first nested list is left with one child');
                    expect(nestedList1.children()[0].children()[0].getText()).to.equal('1.1', 'first nested list item left alone');
                    
                    expect(item3.children()[0].getText()).to.equal('1.2', 'third item ok');

                    expect(item4.getWlxmlClass()).to.equal('item', 'second nested list is still wrapped in item element');
                    expect(nestedList2.children().length).to.equal(1, 'second nested list is left with one child');
                    expect(nestedList2.children()[0].children()[0].getText()).to.equal('1.3', 'second nested list item left alone');

                    expect(item5.children()[0].getText()).to.equal('2', 'last item ok');
                });

                it('puts extracted items below the list if ending item is the last one - nested case' , function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list.items">\
                                <div class="item">0</div>\
                                <div class="item">\
                                    <div class="list.items">\
                                        <div class="item">1.1</div>\
                                        <div class="item">1.2</div>\
                                        <div class="item">1.3</div>\
                                    </div>\
                                </div>\
                                <div class="item">2</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        nestedList = list.children()[1].children()[0],
                        nestedListItem1 = nestedList.children()[1],
                        nestedListItem2 = nestedList.children()[2];

                    c.list.extractItems({element1: nestedListItem1, element2: nestedListItem2});

                    var section = c.doc(),
                        list = section.children()[0],
                        item1 = list.children()[0],
                        item2 = list.children()[1],
                        item3 = list.children()[2],
                        item4 = list.children()[3],
                        item5 = list.children()[4];
                    nestedList = item2.children()[0];

                    expect(list.children().length).to.equal(5, 'top list has five items');
                    expect(item1.children()[0].getText()).to.equal('0', 'first item ok');
                    expect(item2.getWlxmlClass()).to.equal('item', 'nested list is still wrapped in item element');
                    expect(nestedList.children().length).to.equal(1, 'nested list is left with one child');
                    expect(nestedList.children()[0].children()[0].getText()).to.equal('1.1', 'nested list item left alone');
                    expect(item3.children()[0].getText()).to.equal('1.2', 'third item ok');
                    expect(item4.children()[0].getText()).to.equal('1.3', 'fourth item ok');
                    expect(item5.children()[0].getText()).to.equal('2', 'fifth item ok');
                });

                it('puts extracted items above the list if starting item is the first one - nested case' , function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list.items">\
                                <div class="item">0</div>\
                                <div class="item">\
                                    <div class="list.items">\
                                        <div class="item">1.1</div>\
                                        <div class="item">1.2</div>\
                                        <div class="item">1.3</div>\
                                    </div>\
                                </div>\
                                <div class="item">2</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        nestedList = list.children()[1].children()[0],
                        nestedListItem1 = nestedList.children()[0],
                        nestedListItem2 = nestedList.children()[1];

                    c.list.extractItems({element1: nestedListItem1, element2: nestedListItem2});

                    var section = c.doc(),
                        list = section.children()[0],
                        item1 = list.children()[0],
                        item2 = list.children()[1],
                        item3 = list.children()[2],
                        item4 = list.children()[3],
                        item5 = list.children()[4];
                    nestedList = item4.children()[0];

                    expect(list.children().length).to.equal(5, 'top list has five items');
                    expect(item1.children()[0].getText()).to.equal('0', 'first item ok');
                    expect(item2.children()[0].getText()).to.equal('1.1', 'second item ok');
                    expect(item3.children()[0].getText()).to.equal('1.2', 'third item ok');
                    
                    expect(item4.getWlxmlClass()).to.equal('item', 'nested list is still wrapped in item element');
                    expect(nestedList.children().length).to.equal(1, 'nested list is left with one child');
                    expect(nestedList.children()[0].children()[0].getText()).to.equal('1.3', 'nested list item left alone');
                    expect(item5.children()[0].getText()).to.equal('2', 'fifth item ok');
                });

                it('removes list if all its items are extracted - nested case', function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list.items">\
                                <div class="item">0</div>\
                                <div class="item">\
                                    <div class="list.items">\
                                        <div class="item">1.1</div>\
                                        <div class="item">1.2</div>\
                                    </div>\
                                </div>\
                                <div class="item">2</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        nestedList = list.children()[1].children()[0],
                        nestedListItem1 = nestedList.children()[0],
                        nestedListItem2 = nestedList.children()[1];

                    c.list.extractItems({element1: nestedListItem1, element2: nestedListItem2});

                    var section = c.doc(),
                        list = section.children()[0],
                        item1 = list.children()[0],
                        item2 = list.children()[1],
                        item3 = list.children()[2],
                        item4 = list.children()[3];

                    expect(list.children().length).to.equal(4, 'top list has four items');
                    expect(item1.children()[0].getText()).to.equal('0', 'first item ok');
                    expect(item2.children()[0].getText()).to.equal('1.1', 'second item ok');
                    expect(item3.children()[0].getText()).to.equal('1.2', 'third item ok');
                    expect(item4.children()[0].getText()).to.equal('2', 'fourth item ok');
                });

                it('extracts items out of outer most list when merge flag is set to false', function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list.items">\
                                <div class="item">0</div>\
                                <div class="item">\
                                    <div class="list.items">\
                                        <div class="item">1.1</div>\
                                        <div class="item">1.2</div>\
                                    </div>\
                                </div>\
                                <div class="item">2</div>\
                            </div>\
                        </section>'),
                        section = c.doc(),
                        list = section.children()[0],
                        nestedList = list.children()[1].children()[0],
                        nestedListItem = nestedList.children()[0];

                    var test = c.list.extractItems({element1: nestedListItem, element2: nestedListItem, merge: false});

                    expect(test).to.equal(true, 'extraction status ok');

                    var sectionChildren = section.children(),
                        extractedItem = sectionChildren[1];

                    expect(sectionChildren.length).to.equal(3, 'section has three children');
                    expect(sectionChildren[0].is('list')).to.equal(true, 'first child is a list');

                    expect(extractedItem.getWlxmlTag()).to.equal('div', 'extracted item is a wlxml div');
                    expect(extractedItem.getWlxmlClass()).to.equal(undefined, 'extracted item has no wlxml class');
                    expect(extractedItem.children()[0].getText()).to.equal('1.1', 'extracted item ok');
                    expect(sectionChildren[2].is('list')).to.equal(true, 'second child is a list');
                });
            });
        });

    });

    describe('Cursor', function() {

        var getSelection;

        beforeEach(function() {
            getSelection = sinon.stub(window, 'getSelection');
        });

        afterEach(function() {
            getSelection.restore();
        });

        it('returns position when browser selection collapsed', function() {
            var c = canvas.fromXML('<section>Alice has a cat</section>'),
                dom = c.doc().dom(),
                text = $(dom.contents()[0]).contents()[0];

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
            var c = canvas.fromXML('<section>Alice <span>has</span> a <span>big</span> cat</section>'),
                dom = c.doc().dom(),
                text = {
                    alice: dom.contents()[0],
                    has: $(dom.contents()[1]).contents()[0],
                    cat: dom.contents()[4]
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
            var c = canvas.fromXML('<section>Alice <span>has</span> a <span>big</span> cat</section>'),
                dom = c.doc().dom(),
                text = {
                    alice: dom.contents()[0],
                    has: $(dom.contents()[1]).contents()[0],
                    a: dom.contents()[2],
                    big: $(dom.contents()[3]).contents()[0],
                    cat: dom.contents()[4]
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
            
        })
    });

    describe('Serializing document to WLXML', function() {
        it('keeps document intact when no changes have been made', function() {
            var xmlIn = '<section>Alice<div>has</div>a <span class="uri" meta-uri="http://cat.com">cat</span>!</section>',
                c = canvas.fromXML(xmlIn),
                xmlOut = c.toXML();

            var parser = new DOMParser(),
                input = parser.parseFromString(xmlIn, "application/xml").childNodes[0],
                output = parser.parseFromString(xmlOut, "application/xml").childNodes[0];
            
            expect(input.isEqualNode(output)).to.be.true;
        });

        it('keeps arbitrary node attributes intact', function() {
            var xmlIn = '<section a="1" xmlns:dcterms="http://purl.org/dc/terms/"></section>',
                $xmlOut = $(canvas.fromXML(xmlIn).toXML());

            expect($xmlOut.attr('a')).to.equal('1');
            expect($xmlOut.attr('xmlns:dcterms')).to.equal('http://purl.org/dc/terms/');
        });

        it('doesn\' serialize meta attribute if its empty', function() {
            var c;

            c = canvas.fromXML('<section class="uri" meta-uri="some.uri"></section>');
            c.doc().setWlxmlMetaAttr('uri', '');
            expect($(c.toXML()).attr('meta-uri')).to.equal(undefined, 'overriding attribute with zero length string');

            c = canvas.fromXML('<section class="uri"></section>');
            c.doc().setWlxmlMetaAttr('uri', '');
            expect($(c.toXML()).attr('meta-uri')).to.equal(undefined, 'setting attribute to zero length string');
        });

        describe('formatting output xml', function() {
            /*it('keeps white spaces at the edges of input xml', function() {
                var xmlIn = '  <section></section>  ',
                c = canvas.fromXML(xmlIn),
                xmlOut = c.toXML();

                expect(xmlOut.substr(4)).to.equal('   <', 'start');
                expect(xmlOut.substr(-2)).to.equal('>  ', 'end');
            });*/
            it('keeps white space between XML nodes', function() {
                var xmlIn = '<section>\n\n\n<div></div>\n\n\n<div></div>\n\n\n</section>',
                c = canvas.fromXML(xmlIn),
                xmlOut = c.toXML();

                var partsIn = xmlIn.split('\n\n\n'),
                    partsOut = xmlOut.split('\n\n\n');
                
                expect(partsIn).to.deep.equal(partsOut);
            });

            it('keeps white space between XML nodes - inline case', function() {
                var xmlIn = '<section>\n\n\n<span></span>\n\n\n<span></span>\n\n\n</section>',
                c = canvas.fromXML(xmlIn),
                xmlOut = c.toXML();

                var partsIn = xmlIn.split('\n\n\n'),
                    partsOut = xmlOut.split('\n\n\n');
                
                expect(partsIn).to.deep.equal(partsOut);
            });

            it('nests new children block elements', function() {
                var c = canvas.fromXML('<section></section>');
    
                c.doc().append({tag: 'header'});

                var xmlOut = c.toXML();
                expect(xmlOut.split('\n  ')[0]).to.equal('<section>', 'nesting start ok');
                expect(xmlOut.split('\n').slice(-1)[0]).to.equal('</section>', 'nesting end ok');

            });

            it('doesn\'t nest new children inline elements', function() {
                var c = canvas.fromXML('<section></section>');
    
                c.doc().append({tag: 'span'});

                var xmlOut = c.toXML();
                expect(xmlOut).to.equal('<section><span></span></section>');
            });

            it('keeps original white space at the end of text', function() {
                
                var xmlIn = '<header>    Some text ended with white space \
                \
                <span class="uri">Some text</span> some text\
            \
            </header>',
                    c = canvas.fromXML(xmlIn);

            var xmlOut = c.toXML();
            console.log(xmlOut);
            expect(xmlOut).to.equal(xmlIn);
            });

            it('keeps white space around text node', function() {
                var xmlIn = '<section>\
                <header>header1</header>\
                Some text surrounded by white space\
                <header>header2</header>\
            </section>',
                    c = canvas.fromXML(xmlIn);

                var xmlOut = c.toXML();
                expect(xmlOut).to.equal(xmlIn);
            });

            it('keeps white space around text node - last node case', function() {
                var xmlIn = '<section>\
                <header>header</header>\
                    \
                Some text surrounded by white space\
                    \
            </section>',
                    c = canvas.fromXML(xmlIn);

                var xmlOut = c.toXML();
                expect(xmlOut).to.equal(xmlIn);
            });

            it('keeps white space after detaching text element', function() {
                var xmlIn = '<section><header>header</header>\
                    \
                text1\
                    \
            </section>',
                    expectedXmlOut = '<section><header>header</header>\
                    \
                \
                    \
            </section>',
                    c = canvas.fromXML(xmlIn),
                    children = c.doc().children(),
                    text = children[children.length-1];
                
                expect(text.getText()).to.equal('text1');

                text.detach();

                var xmlOut = c.toXML();
                expect(xmlOut).to.equal(expectedXmlOut);
            });

        })
    })
});


});