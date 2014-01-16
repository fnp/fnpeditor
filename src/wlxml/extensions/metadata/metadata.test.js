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
    it('returns empty metadata for node without metadata', function() {
        var doc = getDocumentFromXML('<section></section>');
        expect(doc.root.getMetadata().length).to.equal(0);
    });
    it('allows to set metadata on an element node', function() {
        var doc = getDocumentFromXML('<section></section>');

        var row = doc.root.addMetadata({key: 'key', value: 'value'}),
            metadata = doc.root.getMetadata();

        expect(metadata.length).to.equal(1);
        expect(metadata[0]).to.equal(row, 'aaa');

        expect(row.getKey()).to.equal('key');
        expect(row.getValue()).to.equal('value');
    });
    // it('allows to remove specific metadata row', function() {
    //     var doc = getDocumentFromXML('<section><metadata><dc:key>value</dc:key><dc:key>value</dc:key></metadata></section>'),
    //         metadata = doc.root.getMetadata();
    //     expect(metadata.length).to.equal(2);
    //     row.remove();
    //     expect(metadata.length)
    //     expect(metadata[0].getValue()).to.equal('value');
    // });
    it('reads node\'s metadata from source of its metadata child node', function() {
        var doc = getDocumentFromXML('<section><metadata><dc:key>value</dc:key></metadata></section>'),
            metadata = doc.root.getMetadata();
        expect(metadata.length).to.equal(1);
        expect(metadata[0].getKey()).to.equal('key');
        expect(metadata[0].getValue()).to.equal('value');
    });

    it('serializes node\'s metadata to its metadata child node', function() {
        var doc = getDocumentFromXML('<section></section>');

        doc.root.addMetadata({key: 'key', value: 'value'});

        var metadataNodes = $(doc.toXML()).children('metadata'),
            keyNodes = metadataNodes.children();
        
        expect(metadataNodes).to.have.length(1);
        expect(keyNodes).to.have.length(1);
        expect(keyNodes[0].tagName.toLowerCase()).to.equal('dc:key');
        expect($(keyNodes[0]).text()).to.equal('value');
    });
    it('doesn\'t show metadata node on nodes contents', function() {
        var doc = getDocumentFromXML('<section><metadata><dc:key>value</dc:key></metadata></section>');
        expect(doc.root.contents()).to.have.length(0);
    });

});


});