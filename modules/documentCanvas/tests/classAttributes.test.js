define([
'libs/chai',
'modules/documentCanvas/classAttributes'
], function(chai, classAttributes) {
   
var stubDict = {
    'klass': {
        'prop': 'string'
    },
    'klass-sub1': {
        'prop1': 'string'
    },
    'klass-sub1-sub2': {
        'prop2': 'string'
    }
};

var assert = chai.assert;

suite('Class attributes', function() {
    test('class has own attribute', function() {
        assert.ok(classAttributes.hasMetaAttr('klass-sub1-sub2', 'prop2', stubDict));
    });

    test('class has attributes from parent classes', function() {
        assert.ok(classAttributes.hasMetaAttr('klass-sub1-sub2', 'prop', stubDict));
        assert.ok(classAttributes.hasMetaAttr('klass-sub1-sub2', 'prop1', stubDict));
    });

    test('list of class meta attributes', function() {
        var attrList = classAttributes.getMetaAttrsList('klass-sub1-sub2', stubDict);

        assert.deepEqual(attrList.own, [{name: 'prop2', type: 'string'}]);
        assert.deepEqual(attrList.inheritedFrom['klass-sub1'], [{name: 'prop1', type: 'string'}]);
        assert.deepEqual(attrList.inheritedFrom.klass, [{name: 'prop', type: 'string'}]);
        assert.deepEqual(attrList.all.sort(), [
            {name: 'prop', type: 'string'},
            {name: 'prop1', type: 'string'},
            {name: 'prop2', type: 'string'}
            ].sort(), 'all values');
    });

    test('class without meta attrs', function() {
        var attrList = classAttributes.getMetaAttrsList('some-class', {});
        assert.deepEqual(attrList.own, [], 'empty own list');
        assert.deepEqual(attrList.inheritedFrom, {}, 'empty inherited dict');
        assert.deepEqual(attrList.all, [], 'empty all list');
    });

    test('empty class', function() {
        var attrList = classAttributes.getMetaAttrsList('', {});
        assert.deepEqual(attrList.own, [], 'empty own list');
        assert.deepEqual(attrList.inheritedFrom, {}, 'empty inherited dict');
        assert.deepEqual(attrList.all, [], 'empty all list');
    });
});

});