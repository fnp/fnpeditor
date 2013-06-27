define([
'libs/jquery-1.9.1.min',
'libs/chai', 
'./utils.js',
'modules/documentCanvas/canvasNode'
], function($, chai, utils, canvasNode) {

'use strict';

var assert = chai.assert;

var assertDomEqual = function(lhs, rhs) {
   lhs.attr('id', '');
   rhs.attr('id', '');
   return assert.ok(lhs[0].isEqualNode(rhs[0]), 'nodes are equal');

}

suite('Create canvas node', function() {  
    test('from description', function() {
        var node = canvasNode.create({tag: 'header', klass: 'some-class', content: 'some text content'});
        assert.equal(node.getTag(), 'header');
        assert.equal(node.getClass(), 'some-class');
        assert.equal(node.getContent(), 'some text content');
        assertDomEqual($('<div wlxml-tag="header" wlxml-class="some-class">some text content</div>'), node.dom);
    });
    
    test('from dom object', function() {
        var node = canvasNode.create($('<div wlxml-tag="header" wlxml-class="some-class" id="1">'));
        assert.equal(node.getTag(), 'header');
        assert.equal(node.getClass(), 'some-class');
        //assertDomEqual($('<div wlxml-tag="header" wlxml-class="some-class">'), node.dom);
    });
});

suite('class information', function() {
    test('class of', function() {
        var node = canvasNode.create({tag: 'header', klass: 'a-b-c'});
        assert.ok(node.isOfClass('a'), 'first level');
        assert.ok(node.isOfClass('a-b'), 'second level');
        assert.ok(node.isOfClass('a-b-c'), 'third level');
        assert.notOk(node.isOfClass('b-c'));
        
        var node2 = canvasNode.create({tag: 'header'});
        assert.notOk(node2.isOfClass('b'));

    });

});

suite('comparing nodes', function() {
    test('isSame', function() {
        var html = '<div wlxml-class="some-class" wlxml-tag="some-tag">';
        var dom1 = $(html);
        var dom2 = $(html);
        assert.ok(canvasNode.create(dom1).isSame(canvasNode.create(dom1)));
        assert.notOk(canvasNode.create(dom1).isSame(canvasNode.create(dom2)));
    });
});


});