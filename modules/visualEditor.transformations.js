if(typeof module !== 'undefined' && module.exports) {
    var $ = require('jquery');
}

(function($) {

    var transformations = {};

    transformations.fromXML = {
        getHTMLTree: function(xml) {
            var inner = $(xml).clone();
            var toret = $('<div></div>');
            toret.append(inner);
            toret.find('metadata').remove();
            
            var toBlock = ['div', 'document', 'section', 'header'];
            var toInline = ['aside'];
            
            toBlock.forEach(function(tagName) {
                tagName = tagName.toLowerCase();
                console.log('running ' + tagName);
                toret.find(tagName).replaceWith(function() {
                    var suffix = tagName !== 'div'  ? tagName : 'block';
                    return $('<div></div>').addClass('rng-' + suffix).append($(this).contents());
                });
            });
            
            toInline.forEach(function(tagName) {
                tagName = tagName.toLowerCase();
                toret.find(tagName).replaceWith(function() {
                    var node = this;
                    return $('<span></span>').addClass('rng-' + tagName).append($(this).contents());
                });
            });
            return toret.children();
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