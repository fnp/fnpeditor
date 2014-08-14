define(function(require) {
    
'use strict';
/* globals describe, it */

var chai = require('libs/chai'),
    wlxml = require('wlxml/wlxml');
    //edumedExtension = require('./edumed.js');

var expect = chai.expect;


var getDocumentFromXML = function(xml, options) {
    var doc = wlxml.WLXMLDocumentFromXML(xml, options || {});
    //doc.registerExtension(edumedExtension);
    return doc;
};


describe('Setting answer', function() {
    it('sets answer (1)', function() {
        /* jshint multistr:true */
        var doc = getDocumentFromXML('\
                <div class="exercise.order">\
                    <div class="list.orderable">\
                        <div class="item.answer" answer="3">Element 3</div>\
                        <div class="item.answer" answer="1">Element 1</div>\
                        <div class="item.answer" answer="2">Element 2</div>\
                    </div>\
                </div>');

        doc.root.object.getItems()[2].setAnswer(1);

        var items = doc.root.object.getItems();

        expect(items[0].getAnswer()).to.equal(3);
        expect(items[1].getAnswer()).to.equal(2);
        expect(items[2].getAnswer()).to.equal(1);

    });
    it('sets answer (2)', function() {
        /* jshint multistr:true */
        var doc = getDocumentFromXML('\
                <div class="exercise.order">\
                    <div class="list.orderable">\
                        <div class="item.answer" answer="1">Element 1</div>\
                        <div class="item.answer" answer="2">Element 2</div>\
                        <div class="item.answer" answer="3">Element 3</div>\
                    </div>\
                </div>');
        doc.transaction(function() {
            doc.root.object.getItems()[2].setAnswer(2);
        }, {
            error: function(e) { throw e;}
        });
        

        var items = doc.root.object.getItems();

        expect(items[0].getAnswer()).to.equal(1);
        expect(items[1].getAnswer()).to.equal(3);
        expect(items[2].getAnswer()).to.equal(2);

    });
});




});