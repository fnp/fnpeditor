define(['libs/jquery-1.9.1.min'], function($) {

    'use strict';

    return {
        getMetadata: function(xml) {
            var toret = {};
            $(xml).find('metadata').children().each(function() {
                var node = $(this);
                toret[this.nodeName.split(':')[1].toLowerCase()] = node.text();
            });
            return toret;
        },
        getXML: function(metadata) {
            var meta = $('<metadata></metadata>\n');
            _.each(_.keys(metadata), function(key) {
                meta.append('\n\t<dc:'+key+'>' + metadata[key] + '</dc:'+key+'>');
            });
            meta.append('\n');
            return vkbeautify.xml(meta.html());
        }
    };

});