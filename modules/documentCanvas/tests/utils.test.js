define(['libs/chai', './utils.js'], function(chai, utils) {

'use strict';
var assert = chai.assert;

test('open+open', function() {
    assert.equal(utils.cleanUp('<div class="class"> \n <div class="class"></div></div>'), '<div class="class"><div class="class"></div></div>');
});

test('close+close', function() {
    assert.equal(utils.cleanUp('<div><div></div>\n </div>'), '<div><div></div></div>');
});

test('close+open', function() {
    assert.equal(utils.cleanUp('<div></div>\n <div class="class"></div>'), '<div></div><div class="class"></div>');
});

test('bug', function() {
    var txt = '\
                <section> \
                    <header class="some.class">Head</header>\
                    <header class="some.class">er 1</header>\
                </section>';
    var txt2 = '<section><header class="some.class">Head</header><header class="some.class">er 1</header></section>';
    assert.equal(utils.cleanUp(txt), txt2); 
});


});