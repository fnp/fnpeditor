if(typeof module !== 'undefined' && module.exports) {
    var $ = require('jquery');
}

(function($) {

    var transformations = {};

    transformations.fromXML = {
        getHTMLTree: function(xml) {
            return xml;
        },
        getMetaData: function(xml) {
            var toret = {};
            $(xml).find('metadata').children().each(function() {
                var node = $(this);
                toret[this.nodeName.split(':')[1].toLowerCase()] = node.text();
            })
            return toret;
        },
        getDocumentDescription: function(xml) {
            return {
                HTMLTree: this.getHTMLTree(xml),
                metadata: this.getMetaData(xml)
            }
        }
    }

    transformations.toXML = {
        getXML: function(documentDescription) {
            return documentDescription.HTMLTree;
        }
    }


    if(typeof module !== 'undefined' && module.exports) {
        module.exports = transformations;
    } else {
        rng.modules.visualEditor.transformations = transformations;
    }

})($);