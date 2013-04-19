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
            
            var toBlock = ['div', 'document', 'section', 'header'];
            var toInline = ['aside', 'span'];
            
            toBlock.forEach(function(tagName) {
                tagName = tagName.toLowerCase();
                console.log('running ' + tagName);
                toret.find(tagName).replaceWith(function() {
                    var currentTag = $(this);
                    if(currentTag.attr('wlxml-tag'))
                        return;
                    var toret = $('<div></div>').attr('wlxml-tag', tagName);
                    if(currentTag.attr('class'))
                        toret.attr('wlxml-class', currentTag.attr('class').replace(/\./g, '-'));
                    toret.append(currentTag.contents());
                    return toret;
                });
            });
            
            toInline.forEach(function(tagName) {
                tagName = tagName.toLowerCase();
                toret.find(tagName).replaceWith(function() {
                    var currentTag = $(this);
                    if(currentTag.attr('wlxml-tag'))
                        return;
                    var toret = $('<span></span>').attr('wlxml-tag', tagName);
                    if(currentTag.attr('class'))
                        toret.attr('wlxml-class', currentTag.attr('class').replace(/\./g, '-'));
                    toret.append(currentTag.contents());
                    return toret;
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
            
            var inner = $(documentDescription.HTMLTree);
            var toret = $('<div></div>');
            toret.append(inner);
            
            toret.find('div, span').replaceWith(function() {
                var div = $(this);
                var tagName = div.attr('wlxml-tag');
                var toret = $('<'+tagName+'>');
                if(div.attr('wlxml-class'))
                    toret.attr('class', div.attr('wlxml-class').replace(/-/g, '.'))
                toret.append(div.contents());
                return toret;
            });
            
            var meta = $('<metadata></metadata>\n');
            _.each(_.keys(documentDescription.metadata), function(key) {
                meta.append('\n\t<dc:'+key+'>' + documentDescription.metadata[key] + '</dc:'+key+'>');
            });
            meta.append('\n');
            
            toret.find('metadata').replaceWith(meta);
            
            return toret.html();
            
        }
    }


    if(typeof module !== 'undefined' && module.exports) {
        module.exports = transformations;
    } else {
        rng.modules.visualEditor.transformations = transformations;
    }

})($);