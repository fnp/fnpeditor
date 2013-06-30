define(['libs/jquery-1.9.1.min'], function($) {

    'use strict';

    var transformations = {};

    transformations.fromXML = {
        getHTMLTree: function(xml) {
            var inner = $(xml).clone();
            var toret = $('<div></div>');
            toret.append(inner);
            
            var toBlock = ['div', 'section', 'header'];
            var toInline = ['aside', 'span'];
            
            var transform = function(tags, replacingTagName) {
                tags.forEach(function(tagName) {
                    tagName = tagName.toLowerCase();
                    console.log('running ' + tagName);
                    toret.find(tagName).replaceWith(function() {
                        var currentTag = $(this);
                        if(currentTag.attr('wlxml-tag'))
                            return;
                        var toret = $('<' + replacingTagName + '>').attr('wlxml-tag', tagName);
                        toret.attr('id', 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);}));
                        for(var i = 0; i < this.attributes.length; i++) {
                            var attr = this.attributes.item(i);
                            var value = attr.name === 'class' ? attr.value.replace(/\./g, '-') : attr.value;
                            toret.attr('wlxml-' + attr.name, value);
                        }
                        toret.append(currentTag.contents());
                        return toret;
                    });
                });
            };
            
            transform(toBlock, 'div');
            transform(toInline, 'span');

            toret.find(":not(iframe)").addBack().contents().filter(function() {
                return this.nodeType == 3;} ).each(function() {
                    var n = $(this); 
                    var hasText = /\S/g.test(n.text());
                    if(!hasText) {
                        n.remove();
                        return;
                    }
                    var startSpace = /\s/g.test(n.text().substr(0,1));
                    var endSpace = /\s/g.test(n.text().substr(-1)) && n.text().length > 1;
                    var trimmed = $.trim(n.text());
                    n.get(0).data = (startSpace ? ' ' : '') + trimmed + (endSpace ? ' ' : '');
            });
            
            return toret.children();
        },
        getMetaData: function(xml) {
            var toret = {};
            $(xml).find('metadata').children().each(function() {
                var node = $(this);
                toret[this.nodeName.split(':')[1].toLowerCase()] = node.text();
            });
            return toret;
        },
        getDocumentDescription: function(xml) {
            return {
                HTMLTree: this.getHTMLTree(xml),
                metadata: this.getMetaData(xml)
            };
        }
    };

    transformations.toXML = {
        getXML: function(body) {
            
            var inner = body.clone();
            var toret = $('<div></div>');
            toret.append(inner);
            
            toret.find('div, span').replaceWith(function() {
                var div = $(this);
                var tagName = div.attr('wlxml-tag');
                var toret = $('<'+tagName+'>');
                                   
                for(var i = 0; i < this.attributes.length; i++) {
                    var attr = this.attributes.item(i);
                    var split = attr.name.split('-');
                    console.log(split);
                    if(split[0] !== 'wlxml' || (split.length > 1 && split[1] === 'tag')) 
                        continue;
                    var wlxmlName = split.splice(1).join('-');
                    var value = wlxmlName === 'class' ? attr.value.replace(/-/g, '.') : attr.value;
                    console.log(name + ': ' + value);
                    if(value.length && value.length > 0)
                        toret.attr(wlxmlName, value);
                }
                    
                toret.append(div.contents());
                return toret;
            });

            return vkbeautify.xml(toret.html());
        }
    };

    return transformations;

});