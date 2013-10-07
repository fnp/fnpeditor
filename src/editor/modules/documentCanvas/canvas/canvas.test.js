define([
'libs/chai',
'modules/documentCanvas/canvas/canvas',
'modules/documentCanvas/canvas/documentElement',
'modules/documentCanvas/canvas/utils',
'wlxml/wlxml'
], function(chai, canvas, documentElement, utils, wlxml) {
    
'use strict';

var expect = chai.expect;


var nodeFromXML = function(xml) {
    return wlxml.WLXMLElementNodeFromXML(xml);
};


describe('new Canvas', function() {
    it('abc', function() {
        var doc = wlxml.WLXMLDocumentFromXML('<section>Alice <span>has</span> a cat!</div>'),
            c = canvas.fromXML(doc);

        expect(c.doc().children()).to.have.length(3)
    });
})


});