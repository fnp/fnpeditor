define([
'libs/chai',
'modules/documentCanvas/canvas/canvas',
'modules/documentCanvas/canvas/documentElement'
], function(chai, canvas, documentElement) {
    
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
                            + 'This is some text without its own wrapping tag.'
                            + '<div wlxml-tag="div" wlxml-class="p-subclass">This is a paragraph.</div>'
                            + '<div wlxml-tag="div">This is text in a div <div wlxml-tag="span">with some inline text</div>.</div>'
                            + 'This is some text without its own wrapping tag.'
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
        it('is just a TextNode', function() {
            var dom = canvas.fromXML('<section>Alice</section>').doc().children()[0].dom();
            expect(dom[0].nodeType === Node.TEXT_NODE);
        });
    });

    describe('basic properties', function() {
        it('renders empty document when canvas created from empty XML', function() {
            var c = canvas.fromXML('');
            expect(c.doc()).to.equal(null);
        });

        it('gives access to its document root node', function() {
            var c = canvas.fromXML('<section></section>');
            expect(c.doc().wlxmlTag).to.equal('section');
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
                var c = canvas.fromXML('<section class="some.class"></section>'),
                    section = c.doc();
                expect(section.getWlxmlClass()).to.equal('some.class');
                section.setWlxmlClass('some.other.class');
                expect(section.getWlxmlClass()).to.equal('some.other.class');
                section.setWlxmlClass(null);
                expect(section.getWlxmlClass()).to.be.undefined;
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

                it('can put new TextElement at the end', function() {
                    var c = canvas.fromXML('<section></section>'),
                        appended = c.doc().append({text: 'Alice'}),
                        children = c.doc().children();

                    expect(children.length).to.equal(1);
                    expect(children[0].sameNode(appended));
                    expect(children[0].getText()).to.equal('Alice');
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

                    text.split({offset: 5});
                    expect(section.children().length).to.equal(2, 'section has two children');
                    
                    var header1 = section.children()[0];
                    var header2 = section.children()[1];

                    expect(header1.wlxmlTag).to.equal('header', 'first section child represents wlxml header');
                    expect(header1.children().length).to.equal(1, 'first header has one text child');
                    expect(header1.children()[0].getText()).to.equal('Some ', 'first header has correct content');
                    expect(header2.wlxmlTag).to.equal('header', 'second section child represents wlxml header');
                    expect(header2.children().length).to.equal(1, 'second header has one text child');
                    expect(header2.children()[0].getText()).to.equal('header', 'second header has correct content');
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
                    expect(sectionChildren[0].wlxmlTag).to.equal('header', 'First section element is a wlxml header');
                    expect(sectionChildren[1].wlxmlTag).to.equal('header', 'Second section element is a wlxml header');

                    var firstHeaderChildren = sectionChildren[0].children();
                    expect(firstHeaderChildren.length).to.equal(3, 'First header has three children');
                    expect(firstHeaderChildren[0].getText()).to.equal('A ', 'First header starts with a text');
                    expect(firstHeaderChildren[1].wlxmlTag).to.equal('span', 'First header has span in the middle');
                    expect(firstHeaderChildren[2].getText()).to.equal(' a', 'First header ends with text');

                    var secondHeaderChildren = sectionChildren[1].children();
                    expect(secondHeaderChildren.length).to.equal(3, 'Second header has three children');
                    expect(secondHeaderChildren[0].getText()).to.equal('nd ', 'Second header starts with text');
                    expect(secondHeaderChildren[1].wlxmlTag).to.equal('span', 'Second header has span in the middle');
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
                
                it('wraps part of DocumentTextElement', function() {
                    var c = canvas.fromXML('<section>Alice has a cat</section>'),
                        text = c.doc().children()[0];
                    
                    var returned = text.wrapWithNodeElement({tag: 'header', klass: 'some.class', start: 5, end: 12}),
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
        });

        describe('Lists api', function() {
            it('allows creation of a list from existing sibling DocumentElements', function() {
                var c = canvas.fromXML('\
                    <section>\
                        Alice\
                        <div>has</div>\
                        a\
                        <div>cat</div>\
                    </section>'),
                    section = c.doc(),
                    textAlice = section.children()[0],
                    divCat = section.children()[3]
                
                c.list.create({element1: textAlice, element2: divCat});

                expect(section.children().length).to.equal(1, 'section has one child element');

                var list = section.children()[0];
                expect(list.is('list')).to.equal(true, 'section\'s only child is a list');
                expect(list.children().length).to.equal(4, 'list contains four elements');
                list.children().forEach(function(child) {
                    expect(child.getWlxmlClass()).to.equal('item', 'list childs have wlxml class of item');
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
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        item1 = list.children()[0],
                        item2 = list.children()[1];

                    c.list.extractItems({element1: item1, element2: item1});

                    var section = c.doc(),
                        oldItem = section.children()[0],
                        newList = section.children()[1];

                    expect(section.children().length).to.equal(2, 'section has two children');
                    expect(oldItem.children()[0].getText()).to.equal('0', 'first item extracted');
                    expect(newList.is('list')).to.equal(true, 'list lies below extracted item');
                    expect(newList.children().length).to.equal(1, 'list has now one child');
                });

                it('puts extracted items below the list if ending item is the last one', function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list.items">\
                                <div class="item">0</div>\
                                <div class="item">1</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        item1 = list.children()[0],
                        item2 = list.children()[1];

                    c.list.extractItems({element1: item2, element2: item2});

                    var section = c.doc(),
                        oldItem = section.children()[1],
                        newList = section.children()[0];

                    expect(section.children().length).to.equal(2, 'section has two children');
                    expect(oldItem.children()[0].getText()).to.equal('1', 'first item extracted');
                    expect(newList.is('list')).to.equal(true, 'list lies above extracted item');
                    expect(newList.children().length).to.equal(1, 'list has now one child');
                });

                it('removes list if all its items are extracted', function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list.items">\
                                <div class="item">some item</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        item = list.children()[0];

                    c.list.extractItems({element1: item, element2: item});

                    var section = c.doc(),
                        list1 = section.children()[0],
                        oldItem1 = section.children()[1],
                        oldItem2 = section.children()[2],
                        list2 = section.children()[3];

                    expect(section.children().length).to.equal(1, 'section contains one child');
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

                    c.list.extractItems({element1: nestedListItem, element2: nestedListItem, merge: true});

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
                                    </div>\
                                </div>\
                                <div class="item">2</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        nestedList = list.children()[1].children()[0],
                        nestedListItem = nestedList.children()[1];

                    c.list.extractItems({element1: nestedListItem, element2: nestedListItem, merge: true});

                    var section = c.doc(),
                        list = section.children()[0],
                        item1 = list.children()[0],
                        item2 = list.children()[1],
                        item3 = list.children()[2],
                        item4 = list.children()[3];
                    nestedList = item2.children()[0];

                    expect(list.children().length).to.equal(4, 'top list has four items');
                    expect(item1.children()[0].getText()).to.equal('0', 'first item ok');
                    expect(item2.getWlxmlClass()).to.equal('item', 'nested list is still wrapped in item element');
                    expect(nestedList.children().length).to.equal(1, 'nested list is left with one child');
                    expect(nestedList.children()[0].children()[0].getText()).to.equal('1.1', 'nested list item left alone');
                    expect(item3.children()[0].getText()).to.equal('1.2', 'second item ok');
                    expect(item4.children()[0].getText()).to.equal('2', 'fourth item ok');
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
                                    </div>\
                                </div>\
                                <div class="item">2</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        nestedList = list.children()[1].children()[0],
                        nestedListItem = nestedList.children()[0];

                    c.list.extractItems({element1: nestedListItem, element2: nestedListItem, merge: true});

                    var section = c.doc(),
                        list = section.children()[0],
                        item1 = list.children()[0],
                        item2 = list.children()[1],
                        item3 = list.children()[2],
                        item4 = list.children()[3];
                    nestedList = item3.children()[0];

                    expect(list.children().length).to.equal(4, 'top list has four items');
                    expect(item1.children()[0].getText()).to.equal('0', 'first item ok');
                    expect(item2.children()[0].getText()).to.equal('1.1', 'second item ok');
                    expect(item3.getWlxmlClass()).to.equal('item', 'nested list is still wrapped in item element');
                    expect(nestedList.children().length).to.equal(1, 'nested list is left with one child');
                    expect(nestedList.children()[0].children()[0].getText()).to.equal('1.2', 'nested list item left alone');
                    expect(item4.children()[0].getText()).to.equal('2', 'fourth item ok');
                });

                it('removes list if all its items are extracted - nested case', function() {
                    var c = canvas.fromXML('\
                        <section>\
                            <div class="list.items">\
                                <div class="item">0</div>\
                                <div class="item">\
                                    <div class="list.items">\
                                        <div class="item">1.1</div>\
                                    </div>\
                                </div>\
                                <div class="item">2</div>\
                            </div>\
                        </section>'),
                        list = c.doc().children()[0],
                        nestedList = list.children()[1].children()[0],
                        nestedListItem = nestedList.children()[0];

                    c.list.extractItems({element1: nestedListItem, element2: nestedListItem, merge: true});

                    var section = c.doc(),
                        list = section.children()[0],
                        item1 = list.children()[0],
                        item2 = list.children()[1],
                        item3 = list.children()[2];

                    expect(list.children().length).to.equal(3, 'top list has three items');
                    expect(item1.children()[0].getText()).to.equal('0', 'first item ok');
                    expect(item2.children()[0].getText()).to.equal('1.1', 'second item ok');
                    expect(item3.children()[0].getText()).to.equal('2', 'third item ok');
                });
            });
        });

    });
});


});