define([
'libs/jquery-1.9.1.min',
'libs/chai', 
'./utils.js',
'modules/documentCanvas/canvas',
'modules/documentCanvas/canvasNode'
], function($, chai, utils, canvas, canvasNode) {

    'use strict';

    var assert = chai.assert;
    var assertDomEqual = utils.assertDomEqual;
    
    
    suite('Quering nodes', function() {
        test('getting preceding node', function() {
            var c = canvas.create('<div wlxml-tag="section"><div wlxml-tag="p">a</div><div wlxml-tag="p">b</div></div>');
            var secondP = c.findNodes({tag: 'p'})[1];
            var firstP = c.getPrecedingNode({node: secondP});
            assert.equal(firstP.getContent(), 'a');
        });
        
       test('pervious node of node without "previous siblings" is its parent', function() {
            var c = canvas.create('<div wlxml-tag="section"><div wlxml-tag="p">a</div></div>');
            var paragraph = c.findNodes({tag: 'p'})[0];
            assert.equal(c.getPrecedingNode({node: paragraph}).getTag(), 'section');
        });
    
    });
    
    
    suite('Inserting nodes', function() {
        test('append node to root', function() {
            var c = canvas.create();
            var node = canvasNode.create({tag: 'header', klass: 'some-class'});
            c.nodeAppend({node: node, to: 'root'});
            assertDomEqual(c.getContent(), '<div wlxml-tag="header" wlxml-class="some-class">');
        }); 
        
        test('append node to another node', function() {
            var c = canvas.create('<div wlxml-tag="section"></div>');
            var node = canvasNode.create({tag: 'header', klass: 'some-class'});
            var to = c.findNodes('div')[0];
            c.nodeAppend({node: node, to: to});
            assertDomEqual(c.getContent(), '<div wlxml-tag="section"><div wlxml-tag="header" wlxml-class="some-class"></div></div>');
        });
        
        test('insert node after another node', function() {
            var c = canvas.create('<div wlxml-tag="section"></div>');
            var node = canvasNode.create({tag: 'header', klass: 'some-class'});
            var after = c.findNodes('div')[0];
            c.nodeInsertAfter({node: node, after: after});
            assertDomEqual(c.getContent(), '<div wlxml-tag="section"></div><div wlxml-tag="header" wlxml-class="some-class"></div>');        
        });
        
        test('wrap text in node', function() {
            var c = canvas.create('<div wlxml-tag="section"><div wlxml-tag="header">Header 1</div></div>');
            var header = c.findNodes({tag: 'header'})[0];
            var wrapper = canvasNode.create({tag: 'aside'});
            c.nodeWrap({inside: header, _with: wrapper, offsetStart: 1, offsetEnd: 6})
            assertDomEqual(c.getContent(), '<div wlxml-tag="section"><div wlxml-tag="header">H<span wlxml-tag="aside">eader</span> 1</div></div>');
        });
        
        test('split node', function() {
            var c = canvas.create('<div wlxml-tag="section"><div wlxml-tag="header">Header 1</div></div>');
            var header = c.findNodes({tag: 'header'})[0];
            var newNode = c.nodeSplit({node: header, offset: 4});
            assertDomEqual(c.getContent(), utils.cleanUp('\
                <div wlxml-tag="section">\
                    <div wlxml-tag="header">Head</div>\
                    <div wlxml-tag="header">er 1</div>\
                </div>'));
            assert.ok(newNode.isSame(c.findNodes({tag: 'header'})[1]));
        });
        
        test('split root node', function() {
            var c = canvas.create('<div wlxml-tag="header">cat</div>');
            var header = c.findNodes({tag: 'header'})[0];
            var newNode = c.nodeSplit({node: header, offset: 1});
            assertDomEqual(c.getContent(), utils.cleanUp('\
                    <div wlxml-tag="header">c</div>\
                    <div wlxml-tag="header">at</div>'));
            assert.ok(newNode.isSame(c.findNodes({tag: 'header'})[1]));
        });
        
        test('split node with subnodes', function() {
            var c = canvas.create(utils.cleanUp('\
                <div wlxml-tag="section">\
                    <div wlxml-tag="header">Fancy and nice<span wlxml-tag="aside">header</span> 1</div>\
                 </div>'));
            var header = c.findNodes({tag: 'header'})[0];
            var newNode = c.nodeSplit({node: header, offset: 5});
            assertDomEqual(c.getContent(), utils.cleanUp('\
                <div wlxml-tag="section">\
                    <div wlxml-tag="header">Fancy</div>\
                    <div wlxml-tag="header">and nice<span wlxml-tag="aside">header</span> 1</div>\
                </div>'));
        });
        
        test('remove node', function() {
            var c = canvas.create('<div wlxml-tag="section"><span wlxml-tag="span">some text</span></div>');
            var span = c.findNodes({tag: 'span'})[0];
            c.nodeRemove({node: span});
            assertDomEqual(c.getContent(), '<div wlxml-tag="section"></div>');
        });
    });
    
    
    suite('Lists', function() {
        test('create from existing nodes', function() {
            var c = canvas.create(utils.cleanUp('\
                <div wlxml-tag="section">\
                    <div wlxml-tag="div">alice</div>\
                    has\
                    <div wlxml-tag="div">a</div>\
                    <div wlxml-tag="div">cat</div>\
                    <div wlxml-tag="div">or not</div>\
                </div>'
            ));
            
            var div_alice = c.findNodes({tag: 'div'})[0];
            var div_cat = c.findNodes({tag:'div'})[2];
            
            c.listCreate({start: div_alice, end: div_cat});
            
            assertDomEqual(c.getContent(), utils.cleanUp('\
                <div wlxml-tag="section">\
                    <div wlxml-tag="div" wlxml-class="list-items">\
                        <div wlxml-tag="div" wlxml-class="item">alice</div>\
                        <div wlxml-tag="div" wlxml-class="item">has</div>\
                        <div wlxml-tag="div" wlxml-class="item">a</div>\
                        <div wlxml-tag="div" wlxml-class="item">cat</div>\
                    </div>\
                    <div wlxml-tag="div">or not</div>\
                </div>'));
        });
        
        test('create from existing nodes - start/end order doesn\'t matter', function() {
            var html = utils.cleanUp('\
                    <div wlxml-tag="div">alice</div>\
                    <div wlxml-tag="div">cat</div>');
            var expected = utils.cleanUp('\
                    <div wlxml-tag="div" wlxml-class="list-items">\
                        <div wlxml-tag="div" wlxml-class="item">alice</div>\
                        <div wlxml-tag="div" wlxml-class="item">cat</div>\
                    </div>');
                    
            var c = canvas.create(html);
            var div_alice = c.findNodes({tag: 'div'})[0];
            var div_cat = c.findNodes({tag:'div'})[1];
            c.listCreate({start: div_cat, end: div_alice});
            assertDomEqual(c.getContent(), expected);
            
            c = canvas.create(html);
            div_alice = c.findNodes({tag: 'div'})[0];
            div_cat = c.findNodes({tag:'div'})[1];
            c.listCreate({start: div_alice, end: div_cat});
            assertDomEqual(c.getContent(), expected);
        });
        
        test('remove', function() {
            var c = canvas.create(utils.cleanUp('\
                <div wlxml-tag="section">\
                    <div wlxml-tag="div" wlxml-class="list-items">\
                        <div wlxml-tag="div" wlxml-class="item">alice</div>\
                        <div wlxml-tag="div" wlxml-class="item">cat</div>\
                    </div>\
                </div>'));
            var item = c.findNodes({klass: 'item'})[1];
            c.listRemove({pointer: item});
            assertDomEqual(c.getContent(), utils.cleanUp('\
                <div wlxml-tag="section">\
                    <div wlxml-tag="div">alice</div>\
                    <div wlxml-tag="div">cat</div>\
                </div>'));
        });
        
        test('checking if node is inside a list', function() {
            var c = canvas.create(utils.cleanUp('\
                <div wlxml-tag="section">\
                    <div wlxml-tag="div" wlxml-class="list-items-enum">\
                        <div wlxml-tag="div" wlxml-class="item">alice</div>\
                        <div wlxml-tag="div" wlxml-class="item">cat</div>\
                    </div>\
                </div>'));
            var item = c.findNodes({klass: 'item'})[1];
            assert.ok(c.nodeInsideList({node: item}));
        });
    });
});