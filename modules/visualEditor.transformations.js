rng.modules.visualEditor.transformations = {};

rng.modules.visualEditor.transformations.fromXML = {
    getHTMLTree: function(xml) {
        return xml;
    },
    getMetaData: function(xml) {
        return {};
    },
    getDocumentDescription: function(xml) {
        return {
            HTMLTree: this.getHTMLTree(xml),
            metadata: this.getMetaData(xml)
        }
    }

}

rng.modules.visualEditor.transformations.toXML = {
    getXML: function(documentDescription) {
        return documentDescription.HTMLTree;
    }
}