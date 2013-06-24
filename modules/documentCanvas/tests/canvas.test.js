define([
'libs/jquery-1.9.1.min',
'libs/chai', 
'./utils.js',
'modules/documentCanvas/canvas'
], function($, chai, utils, canvas) {

    'use strict';

    var assert = chai.assert;
    
    assert.xmlEqual = function(lhsText, rhsText) {
        var cleanLhs = utils.cleanUp(lhsText);
        var cleanRhs = utils.cleanUp(rhsText);
        
        var lhs = $(cleanLhs);
        var rhs = $(cleanRhs);
        
        this.equal(lhs.length, 1);
        this.equal(rhs.length, 1);
        
        lhs = lhs.get(0);
        rhs = rhs.get(0);
        
        var test = lhs.isEqualNode(rhs);
        if(!test) {
            console.log(cleanLhs);
            console.log(cleanRhs);    
        }
        return this.ok(test, 'xmls are equal');
    };
    
    var retrievingTest = function(title, xml) {
        test(title, function() {
            var c = new canvas.Canvas(xml);
            assert.xmlEqual(c.toXML(), xml);    
        });
    };
    
    suite('Basic document retrieving', function() {
        test('empty document', function() {
            var c = new canvas.Canvas('');
            assert.equal(c.toXML(), '');
        });
        retrievingTest('empty tag', '<section></section>');
        retrievingTest('tag with content', '<section>Some text</section>');
        retrievingTest('tag with class', '<section class="some.class"></section>');
    });
    
    suite('Nodes', function() {
        test('getting nodes via selector', function() {
            var c = new canvas.Canvas('<section><header class="some.class">Header 1</header></section>');
            var header = c.getNode({tag: 'header'})[0];
            assert.equal(header.tag, 'header');
            assert.equal(header.klass, 'some-class');
        });
        
        test('getting previous node', function() {
            var c = new canvas.Canvas('<section><div class="some.class">Div 1</div><div class="some.other.class">Div 2</div></section>');
            var secondDiv = c.getNode({tag: 'div'})[1];
            var firstDiv = c.getPreviousNode({node: secondDiv});
            assert.equal(firstDiv.klass, 'some-class');
        })
        
        test('pervious node of node without "previous siblings" is its parent', function() {
            var c = new canvas.Canvas('<section><div class="some.class">Div 1</div></section>');
            var div = c.getNode({tag: 'div'})[0];
            var section = c.getPreviousNode({node: div});
            assert.equal(section.tag, 'section');
        })
    
        test('inserting after', function() {
            var c = new canvas.Canvas('<section><header>Header 1</header></section>');
            var header = c.getNode({tag: 'header'})[0];
            c.insertNode({place: 'after', context: header, tag: 'div', klass: 'some.class'});
            assert.xmlEqual(c.toXML(), '<section><header>Header 1</header><div class="some.class"></div></section>');
        });
        
        test('wrap text in node', function() {
            var c = new canvas.Canvas('<section><header>Header 1</header></section>');
            var header = c.getNode({tag: 'header'})[0];
            c.insertNode({place: 'wrapText', context: header, tag: 'span', klass: 'url', offsetStart: 1, offsetEnd: 6});
            assert.xmlEqual(c.toXML(), '<section><header>H<span class="url">eader</span> 1</header></section>');
        });
        
        test('split node', function() {
            var c = new canvas.Canvas('<section><header class="some.class">Header 1</header></section>');
            var header = c.getNode({tag: 'header'})[0];
            c.splitNode({node: header, offset: 4});
            assert.xmlEqual(c.toXML(), '\
                <section> \
                    <header class="some.class">Head</header>\
                    <header class="some.class">er 1</header>\
                </section>'
            );
        });
        
        test('split node with subnodes', function() {
            var c = new canvas.Canvas('<section><header class="some.class">Fancy and nice <span>header</span> 1</header></section>');
            var header = c.getNode({tag: 'header'})[0];
            c.splitNode({node: header, textNodeIdx: 0, offset: 5});
            assert.xmlEqual(c.toXML(), '\
                <section> \
                    <header class="some.class">Fancy</header>\
                    <header class="some.class"> and nice <span>header</span> 1</header>\
                </section>'
            );
        });
        
        test('remove node', function() {
            var c = new canvas.Canvas('<section><header class="some.class">Fancy and nice <span>header</span> 1</header></section>');
            var span = c.getNode({tag: 'span'})[0];
            var siblings = c.removeNode({node:span});
            assert.xmlEqual(c.toXML(), '\
                <section>\
                    <header class="some.class">Fancy and nice  1</header>\
                </section>'
            );
        });
        
        test('create list from existing nodes', function() {
            var c = new canvas.Canvas('<section><div>Alice</div>has<div>a cat</div><div>some text</div></section>');
            var div1 = c.getNode({tag:'div'})[0];
            var div2 = c.getNode({tag:'div'})[1];
            
            c.createList({start: div1, end: div2});
            
            assert.xmlEqual(c.toXML(), '\
                <section>\
                    <div class="list.items">\
                        <div class="item">Alice</div>\
                        <div class="item">has</div>\
                        <div class="item">a cat</div>\
                    </div>\
                    <div>some text</div>\
                </section>');

        });
        
        test('remove list', function() {
            var xml = '\
                <section>\
                    <div class="list.items">\
                        <div class="item">Alice</div>\
                        <div class="item">has</div>\
                        <div class="item">a cat</div>\
                    </div>\
                    <div>some text</div>\
                </section>';
           var c = new canvas.Canvas(xml);
           var item = c.getNode({klass: 'item'})[1];
           c.removeList({pointer: item});
           assert.xmlEqual(c.toXML(), '\
                <section>\
                    <div>Alice</div>\
                    <div>has</div>\
                    <div>a cat</div>\
                    <div>some text</div>\
                </section>');
        });
    });

});