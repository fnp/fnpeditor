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

describe('Assign exercise', function() {
    /* jshint multistr:true */
    it('assigns source to destination', function() {
        var doc = getDocumentFromXML('\
                <div class="exercise.assign">\
                    <div class="list" target="kategorie">\
                        <div class="item.answer">Element 1</div>\
                        <div class="item.answer">Element 2</div>\
                    </div>\
                    <div class="list" id="kategorie">\
                        <div class="item" id="kat1">Kategoria 1</div>\
                        <div class="item" id="kat2">Kategoria 2</div>\
                    </div>\
                </div>'),
            exercise = doc.root,
            element = exercise.object.getSourceItems()[1],
            categories = exercise.object.getDestinationItems(),
            elementNode = exercise.contents()[0].contents()[1];
        
        element.assignTo(categories[0]);
        expect(elementNode.getAttr('answer')).to.equal('kat1');
        expect(element.isAssignedTo(categories[0])).to.equal(true);

        element.assignTo(categories[1]);
        expect(elementNode.getAttr('answer')).to.equal('kat1,kat2');
        expect(element.isAssignedTo(categories[1])).to.equal(true);
    });
    it('removes assignment between source and destination', function() {
        var doc = getDocumentFromXML('\
                <div class="exercise.assign">\
                    <div class="list" target="kategorie">\
                        <div class="item.answer">Element 1</div>\
                        <div class="item.answer" answer="kat1,kat2">Element 2</div>\
                    </div>\
                    <div class="list" id="kategorie">\
                        <div class="item" id="kat1">Kategoria 1</div>\
                        <div class="item" id="kat2">Kategoria 2</div>\
                    </div>\
                </div>'),
            exercise = doc.root,
            element = exercise.object.getSourceItems()[1],
            categories = exercise.object.getDestinationItems(),
            elementNode = exercise.contents()[0].contents()[1];
        
        element.removeFrom(categories[0]);
        expect(elementNode.getAttr('answer')).to.equal('kat2');

        element.removeFrom(categories[1]);
        expect(elementNode.getAttr('answer')).to.equal(undefined, 'empty');
    });
});



});