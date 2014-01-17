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


describe('Metadata API', function() {
    it('returns empty metadata for node without metadata', function() {
        var doc = getDocumentFromXML('<section></section>');
        expect(doc.root.getMetadata().length).to.equal(0);
    });
    it('allows to set metadata on an element node', function() {
        var doc = getDocumentFromXML('<section></section>'),
            metadata = doc.root.getMetadata();
        
        var row = metadata.add({key: 'key', value: 'value'});
        expect(metadata.length).to.equal(1);
        expect(metadata.at(0)).to.equal(row);
        expect(row.getKey()).to.equal('key');
        expect(row.getValue()).to.equal('value');
    });
    it('allows to remove specific metadata row', function() {
        var doc = getDocumentFromXML('<section><metadata><dc:key>value</dc:key><dc:key>value</dc:key></metadata></section>'),
            metadata = doc.root.getMetadata();
        
        expect(metadata.length).to.equal(2);
        metadata.at(0).remove();
        expect(metadata.length).to.equal(1);
        expect(metadata.at(0).getValue()).to.equal('value');
    });
    it('reads node\'s metadata from source of its metadata child node', function() {
        var doc = getDocumentFromXML('<section><metadata><dc:key>value</dc:key></metadata></section>'),
            metadata = doc.root.getMetadata();
        expect(metadata.length).to.equal(1);
        expect(metadata.at(0).getKey()).to.equal('key');
        expect(metadata.at(0).getValue()).to.equal('value');
    });

    it('serializes node\'s metadata to its metadata child node', function() {
        var doc = getDocumentFromXML('<section></section>');

        doc.root.getMetadata().add({key: 'key', value: 'value'});

        var metadataNodes = $(doc.toXML()).children('metadata'),
            keyNodes = metadataNodes.children();
        
        expect(metadataNodes).to.have.length(1);
        expect(keyNodes).to.have.length(1);
        expect(keyNodes[0].tagName.toLowerCase()).to.equal('dc:key');
        expect($(keyNodes[0]).text()).to.equal('value');
    });

    describe('Hiding metadata nodes from document api', function() {
        it('hides metadata nodes from document api', function() {
            var doc = getDocumentFromXML('<section><div></div><metadata><dc:key>value</dc:key></metadata><div></div></section>'),
                rootContents = doc.root.contents();
            expect(rootContents).to.have.length(2);
            expect(rootContents[0].getTagName()).to.equal('div');
            expect(rootContents[1].getTagName()).to.equal('div');
            expect(rootContents[0].next().sameNode(rootContents[1])).to.equal(true);
            expect(rootContents[1].prev().sameNode(rootContents[0])).to.equal(true);
        });

        it('merges adjacent text nodes', function() {
            var doc = getDocumentFromXML('<section>Alice<metadata></metadata> has a cat</section>'),
                contents = doc.root.contents();
            expect(contents.length).to.equal(1);
            expect(contents[0].getText()).to.equal('Alice has a cat');
        });
    });

    describe('undo', function() {
        it('undoes adding metadata', function() {
            var doc = getDocumentFromXML('<section></section>'),
                metadata = doc.root.getMetadata();
            metadata.add({key: 'k', value: 'v'});
            doc.undo();
            expect(metadata.length).to.equal(0);
            doc.redo();
            expect(metadata.length).to.equal(1);
            expect(metadata.at(0).getValue()).to.equal('v');
        });
        it('undoes changing metadata key', function() {
            var doc = getDocumentFromXML('<section><metadata><dc:key>value</dc:key></metadata></section>'),
                metadata = doc.root.getMetadata(),
                row = metadata.at(0);

            row.setKey('key2');
            doc.undo();
            expect(row.getKey()).to.equal('key');
            doc.redo();
            expect(row.getKey()).to.equal('key2');
        });
        it('undoes changing metadata value', function() {
            var doc = getDocumentFromXML('<section><metadata><dc:key>value</dc:key></metadata></section>'),
                metadata = doc.root.getMetadata(),
                row = metadata.at(0);

            row.setValue('value2');
            doc.undo();
            expect(row.getValue()).to.equal('value');
            doc.redo();
            expect(row.getValue()).to.equal('value2');
        });
        it('undoes removing metadata', function() {
            var doc = getDocumentFromXML('<section><metadata><dc:key>value</dc:key></metadata></section>'),
                metadata = doc.root.getMetadata(),
                row = metadata.at(0);
            
            row.remove();
            doc.undo();
            expect(metadata.length).to.equal(1, 'undo brought back metadata');
            doc.redo();
            expect(metadata.length).to.equal(0, 'redo removed metadata');
        });
    });



});


});