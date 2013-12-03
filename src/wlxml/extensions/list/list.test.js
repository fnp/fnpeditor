define(function(require) {
    
'use strict';

var chai = require('libs/chai'),
    wlxml = require('wlxml/wlxml'),
    expect = chai.expect,
    $ = require('libs/jquery'),
    lists = require('wlxml/extensions/list/list');


var getDocumentFromXML = function(xml, options) {
    return wlxml.WLXMLDocumentFromXML(xml, options || {});
};

var removeEmptyTextNodes = function(xml) {
    xml = $($.trim(xml));
    xml.find(':not(iframe)')
        .addBack()
        .contents()
        .filter(function() {return this.nodeType === Node.TEXT_NODE;})
        .each(function() {
            if(!this.data.length) {
                $(this).remove();
            }
        });
    return $('<w>').append(xml).html();
};


describe('Lists extension', function() {

    describe('creating lists', function() {
        it('allows creation of a list from existing sibling DocumentElements', function() {
            var doc = getDocumentFromXML('<section>Alice<div>has</div>a<div>cat</div></section>'),
                section = doc.root,
                div1 = section.contents()[1],
                textA = section.contents()[2];
            
            doc.transform('createList', {node1: div1, node2: textA});

            expect(section.contents().length).to.equal(3, 'section has three child nodes');

            var child1 = section.contents()[0],
                list = section.contents()[1],
                child3 = section.contents()[2];

            expect(child1.getText()).to.equal('Alice');
            expect(list.is('list')).to.equal(true, 'second child is a list');
            expect(list.contents().length).to.equal(2, 'list contains two elements');
            list.contents().forEach(function(child) {
                 expect(child.getClass()).to.equal('item', 'list childs have wlxml class of item');
            });
            expect(child3.contents()[0].getText()).to.equal('cat');
        });

        it('allows creating nested list from existing sibling list items', function() {
            var doc = getDocumentFromXML('\
                <section>\
                    <div class="list">\
                        <div class="item">A</div>\
                        <div class="item">B</div>\
                        <div class="item">C</div>\
                        <div class="item">D</div>\
                    </div>\
                </section>');
                
                var outerList = doc.root.contents('.list')[0],
                itemB = outerList.contents('.item')[1],
                itemC = outerList.contents('.item')[2];

            
            doc.transform('createList', {node1: itemB, node2: itemC});

            var outerListItems = outerList.contents('.item'),
                innerList = outerListItems[1].contents()[0];
            
            var innerListItems = innerList.contents('.item');

            expect(outerListItems.length).to.equal(3, 'outer list has three items');
            expect(outerListItems[0].contents()[0].getText()).to.equal('A', 'first outer item ok');
            expect(outerListItems[1].getClass()).to.equal('item', 'inner list is wrapped by item element');

            expect(innerList.is('list')).to.equal(true, 'inner list created');
            expect(innerListItems.length).to.equal(2, 'inner list has two items');
            expect(innerListItems[0].contents()[0].getText()).to.equal('B', 'first inner item ok');
            expect(innerListItems[1].contents()[0].getText()).to.equal('C', 'second inner item ok');

            expect(outerListItems[2].contents()[0].getText()).to.equal('D', 'last outer item ok');

        });
    });

    describe('extracting list items', function() {
        it('creates two lists with extracted items in the middle if extracting from the middle of the list', function() {
            var doc = getDocumentFromXML(removeEmptyTextNodes('\
                <section>\
                    <div class="list">\
                        <div class="item">0</div>\
                        <div class="item">1</div>\
                        <div class="item">2</div>\
                        <div class="item">3</div>\
                    </div>\
                </section>')),
                list = doc.root.contents()[0],
                item1 = list.contents()[1],
                item2 = list.contents()[2];

            doc.transform('extractItems', {item1: item1, item2: item2});

            var section = doc.root,
                list1 = section.contents()[0],
                oldItem1 = section.contents()[1],
                oldItem2 = section.contents()[2],
                list2 = section.contents()[3];

            expect(section.contents().length).to.equal(4, 'section contains two old items and two lists');
            
            expect(list1.is('list')).to.equal(true, 'first section child is a list');
            expect(list1.contents().length).to.equal(1, 'first list has one child');
            expect(list1.contents()[0].contents()[0].getText()).to.equal('0', 'first item of the first list is a first item of the original list');

            expect(oldItem1.contents()[0].getText()).to.equal('1', 'first item got extracted');
            expect(oldItem1.getClass() === '').to.equal(true, 'first extracted element has no wlxml class');

            expect(oldItem2.contents()[0].getText()).to.equal('2', 'second item got extracted');
            expect(oldItem2.getClass() === '').to.equal(true, 'second extracted element has no wlxml class');

            expect(list2.is('list')).to.equal(true, 'last section child is a list');
            expect(list2.contents().length).to.equal(1, 'second list has one child');
            expect(list2.contents()[0].contents()[0].getText()).to.equal('3', 'first item of the second list is a last item of the original list');
        });

        it('puts extracted items above the list if starting item is the first one', function() {
            var doc = getDocumentFromXML(removeEmptyTextNodes('\
                <section>\
                    <div class="list">\
                        <div class="item">0</div>\
                        <div class="item">1</div>\
                        <div class="item">2</div>\
                    </div>\
                </section>')),
                list = doc.root.contents()[0],
                item1 = list.contents()[0],
                item2 = list.contents()[1],
                item3 = list.contents()[2];

            doc.transform('extractItems', {item1: item1, item2: item2});

            var section = doc.root,
                oldItem1 = section.contents()[0],
                oldItem2 = section.contents()[1],
                newList = section.contents()[2];

            expect(section.contents().length).to.equal(3, 'section has three children');
            expect(oldItem1.contents()[0].getText()).to.equal('0', 'first item extracted');
            expect(oldItem2.contents()[0].getText()).to.equal('1', 'second item extracted');
            expect(newList.is('list')).to.equal(true, 'list lies below extracted item');
            expect(newList.contents().length).to.equal(1, 'list has now one child');
        });

        it('puts extracted items below the list if ending item is the last one', function() {
            var doc = getDocumentFromXML(removeEmptyTextNodes('\
                <section>\
                    <div class="list">\
                        <div class="item">0</div>\
                        <div class="item">1</div>\
                        <div class="item">2</div>\
                    </div>\
                </section>')),
                list = doc.root.contents()[0],
                item1 = list.contents()[0],
                item2 = list.contents()[1],
                item3 = list.contents()[2];

            doc.transform('extractItems', {item1: item2, item2: item3});

            var section = doc.root,
                oldItem1 = section.contents()[1],
                oldItem2 = section.contents()[2],
                newList = section.contents()[0];

            expect(section.contents().length).to.equal(3, 'section has three children');
            expect(oldItem1.contents()[0].getText()).to.equal('1', 'first item extracted');
            expect(oldItem2.contents()[0].getText()).to.equal('2', 'second item extracted');
            expect(newList.is('list')).to.equal(true, 'list lies above extracted item');
            expect(newList.contents().length).to.equal(1, 'list has now one child');
        });

        it('removes list if all its items are extracted', function() {
            var doc = getDocumentFromXML(removeEmptyTextNodes('\
                <section>\
                    <div class="list">\
                        <div class="item">some item</div>\
                        <div class="item">some item 2</div>\
                    </div>\
                </section>')),
                list = doc.root.contents()[0],
                item1 = list.contents()[0],
                item2 = list.contents()[1];

            doc.transform('extractItems', {item1: item1, item2: item2});

            var section = doc.root,
                oldItem1 = section.contents()[0],
                oldItem2 = section.contents()[1];

            expect(section.contents().length).to.equal(2, 'section contains two children');
            expect(oldItem1.contents()[0].getText()).to.equal('some item');
            expect(oldItem2.contents()[0].getText()).to.equal('some item 2');
        });

        it('creates two lists with extracted items in the middle if extracting from the middle of the list - nested case' , function() {
            var doc = getDocumentFromXML(removeEmptyTextNodes('\
                <section>\
                    <div class="list">\
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
                </section>')),
                list = doc.root.contents()[0],
                nestedList = list.contents()[1].contents()[0],
                nestedListItem = nestedList.contents()[1];

            doc.transform('extractItems', {item1: nestedListItem, item2: nestedListItem});

            var section = doc.root,
                list = section.contents()[0],
                item1 = list.contents()[0],
                item2 = list.contents()[1], //
                item3 = list.contents()[2],
                item4 = list.contents()[3], //
                item5 = list.contents()[4],
                nestedList1 = item2.contents()[0],
                nestedList2 = item4.contents()[0];

            expect(list.contents().length).to.equal(5, 'top list has five items');
            
            expect(item1.contents()[0].getText()).to.equal('0', 'first item ok');

            expect(item2.getClass()).to.equal('item', 'first nested list is still wrapped in item element');
            expect(nestedList1.contents().length).to.equal(1, 'first nested list is left with one child');
            expect(nestedList1.contents()[0].contents()[0].getText()).to.equal('1.1', 'first nested list item left alone');
            
            expect(item3.contents()[0].getText()).to.equal('1.2', 'third item ok');

            expect(item4.getClass()).to.equal('item', 'second nested list is still wrapped in item element');
            expect(nestedList2.contents().length).to.equal(1, 'second nested list is left with one child');
            expect(nestedList2.contents()[0].contents()[0].getText()).to.equal('1.3', 'second nested list item left alone');

            expect(item5.contents()[0].getText()).to.equal('2', 'last item ok');
        });

        it('puts extracted items below the list if ending item is the last one - nested case' , function() {
            var doc = getDocumentFromXML(removeEmptyTextNodes('\
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
                </section>')),
                list = doc.root.contents()[0],
                nestedList = list.contents()[1].contents()[0],
                nestedListItem1 = nestedList.contents()[1],
                nestedListItem2 = nestedList.contents()[2];

            doc.transform('extractItems', {item1: nestedListItem1, item2: nestedListItem2});

            var section = doc.root,
                list = section.contents()[0],
                item1 = list.contents()[0],
                item2 = list.contents()[1],
                item3 = list.contents()[2],
                item4 = list.contents()[3],
                item5 = list.contents()[4];
            nestedList = item2.contents()[0];

            expect(list.contents().length).to.equal(5, 'top list has five items');
            expect(item1.contents()[0].getText()).to.equal('0', 'first item ok');
            expect(item2.getClass()).to.equal('item', 'nested list is still wrapped in item element');
            expect(nestedList.contents().length).to.equal(1, 'nested list is left with one child');
            expect(nestedList.contents()[0].contents()[0].getText()).to.equal('1.1', 'nested list item left alone');
            expect(item3.contents()[0].getText()).to.equal('1.2', 'third item ok');
            expect(item4.contents()[0].getText()).to.equal('1.3', 'fourth item ok');
            expect(item5.contents()[0].getText()).to.equal('2', 'fifth item ok');
        });

        it('puts extracted items above the list if starting item is the first one - nested case' , function() {
            var doc = getDocumentFromXML(removeEmptyTextNodes('\
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
                </section>')),
                list = doc.root.contents()[0],
                nestedList = list.contents()[1].contents()[0],
                nestedListItem1 = nestedList.contents()[0],
                nestedListItem2 = nestedList.contents()[1];

            doc.transform('extractItems', {item1: nestedListItem1, item2: nestedListItem2});

            var section = doc.root,
                list = section.contents()[0],
                item1 = list.contents()[0],
                item2 = list.contents()[1],
                item3 = list.contents()[2],
                item4 = list.contents()[3],
                item5 = list.contents()[4];
            nestedList = item4.contents()[0];

            expect(list.contents().length).to.equal(5, 'top list has five items');
            expect(item1.contents()[0].getText()).to.equal('0', 'first item ok');
            expect(item2.contents()[0].getText()).to.equal('1.1', 'second item ok');
            expect(item3.contents()[0].getText()).to.equal('1.2', 'third item ok');
            
            expect(item4.getClass()).to.equal('item', 'nested list is still wrapped in item element');
            expect(nestedList.contents().length).to.equal(1, 'nested list is left with one child');
            expect(nestedList.contents()[0].contents()[0].getText()).to.equal('1.3', 'nested list item left alone');
            expect(item5.contents()[0].getText()).to.equal('2', 'fifth item ok');
        });

        it('removes list if all its items are extracted - nested case', function() {
            var doc = getDocumentFromXML(removeEmptyTextNodes('\
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
                </section>')),
                list = doc.root.contents()[0],
                nestedList = list.contents()[1].contents()[0],
                nestedListItem1 = nestedList.contents()[0],
                nestedListItem2 = nestedList.contents()[1];

            doc.transform('extractItems', {item1: nestedListItem1, item2: nestedListItem2});

            var section = doc.root,
                list = section.contents()[0],
                item1 = list.contents()[0],
                item2 = list.contents()[1],
                item3 = list.contents()[2],
                item4 = list.contents()[3];

            expect(list.contents().length).to.equal(4, 'top list has four items');
            expect(item1.contents()[0].getText()).to.equal('0', 'first item ok');
            expect(item2.contents()[0].getText()).to.equal('1.1', 'second item ok');
            expect(item3.contents()[0].getText()).to.equal('1.2', 'third item ok');
            expect(item4.contents()[0].getText()).to.equal('2', 'fourth item ok');
        });

        it('extracts items out of outer most list when merge flag is set to false', function() {
            var doc = getDocumentFromXML(removeEmptyTextNodes('\
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
                </section>')),
                section = doc.root,
                list = section.contents()[0],
                nestedList = list.contents()[1].contents()[0],
                nestedListItem = nestedList.contents()[0];

            var test = doc.transform('extractItems', {item1: nestedListItem, item2: nestedListItem, merge: false});

            expect(test).to.equal(true, 'extraction status ok');

            var sectionContents = section.contents(),
                extractedItem = sectionContents[1];

            expect(sectionContents.length).to.equal(3, 'section has three children');
            expect(sectionContents[0].is('list')).to.equal(true, 'first child is a list');

            expect(extractedItem.getTagName()).to.equal('div', 'extracted item is a wlxml div');
            expect(extractedItem.getClass()).to.equal('', 'extracted item has no wlxml class');
            expect(extractedItem.contents()[0].getText()).to.equal('1.1', 'extracted item ok');
            expect(sectionContents[2].is('list')).to.equal(true, 'second child is a list');
        });
    });

});

});