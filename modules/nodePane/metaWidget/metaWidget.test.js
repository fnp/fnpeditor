define([
'libs/chai',
'libs/sinon',
'modules/nodePane/metaWidget/metaWidget'
], function(chai, sinon, metaWidget) {

'use strict';

var assert = chai.assert;

suite('metaWidget', function() {
    test('simple string field', function() {
        var dom = $('<div>');
        var widget = metaWidget.create({
                el: dom,
                attrs: [{name: 'uri', type: 'string', value: 'test string'}],
            });

        var spy = sinon.spy();
        widget.on('valueChanged', spy);
        var input = dom.find('input');

        input.change();
        assert.ok(spy.calledOnce, 'called once');
        assert.ok(spy.calledWith('uri', 'test string'), 'called with');

        spy.reset();
        input.val('new val').change();
        assert.ok(spy.calledOnce, 'called once');
        assert.ok(spy.calledWith('uri', 'new val'), 'called with new val');
    });
});


});