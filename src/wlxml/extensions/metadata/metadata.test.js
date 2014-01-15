define(function(require) {
    
'use strict';

/* jshint multistr:true */
/* globals describe, it */

var chai = require('libs/chai'),
    wlxml = require('wlxml/wlxml'),
    expect = chai.expect,
    $ = require('libs/jquery');

var getDocumentFromXML = function(xml, options) {
    return wlxml.WLXMLDocumentFromXML(xml, options || {});
};


describe.only('Metadata API', function() {
    it('allows to set metadata on an element node', function() {
        var doc = getDocumentFromXML('<section></section>');
        expect(doc.root.getMetadata()).to.deep.equal([]);
        doc.root.addMetadataRow({key: 'key', value: 'value'});
        expect(doc.root.getMetadata()).to.deep.equal([{key: 'key', value: 'value'}]);
    });

    it('reads node\'s metadata from its metadata child node', function() {
        var doc = getDocumentFromXML('<section><metadata><dc:key>value</dc:key></metadata></section>');
        expect(doc.root.getMetadata()).to.deep.equal([{key: 'key', value: 'value'}]);
    });

    it('serializes node\'s metadata to its metadata child node', function() {
        var doc = getDocumentFromXML('<section></section>');

        doc.root.addMetadataRow({key: 'key', value: 'value'});

        var metadataNodes = $(doc.toXML()).children('metadata'),
            keyNodes = metadataNodes.children();
        
        expect(metadataNodes).to.have.length(1);
        expect(keyNodes).to.have.length(1);
        expect(keyNodes[0].tagName.toLowerCase()).to.equal('dc:key');
        expect($(keyNodes[0]).text()).to.equal('value');
    });
    it('doesnt show metadata node on nodes contents', function() {
        var doc = getDocumentFromXML('<section><metadata><dc:key>value</dc:key></metadata></section>');
        expect(doc.root.contents()).to.have.length(0);
    });
});


});