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
        
        test('list', function() {
            var c = new canvas.Canvas('<section><div>Alice</div>has<div>a cat</div></section>');
            var div1 = c.getNode({tag:'div'})[0];
            var div2 = c.getNode({tag:'div'})[1];
            
            c.createList({start: div1, end: div2});
            
            assert.xmlEqual(c.toXML(), '\
                <section>\
                    <div class="list">\
                        <div class="list.item">Alice</div>\
                        <div class="list.item">has</div>\
                        <div class="list.item">a cat</div>\
                    </div>\
                </section>');
            
        });
    });

});