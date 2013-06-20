define(['libs/jquery-1.9.1.min'], function($) {
    return {
        cleanUp: function(xml) {
            
            var rmws = function(node) {
                if(node.nodeType === 3) {
                    node.data = $.trim(node.data);
                }
                else {
                    $(node).contents().each(function() {
                        rmws(this);
                    });
                }
            }
            
            xml = $($.trim(xml));
            xml.each(function() {
                rmws(this);
            });
            
            /*var toret = xml
                .replace(/(<.*>)\s*(<.*>)/gm, '$1$2')
                .replace(/(<\/.*>)\s*(<\/.*>)/gm, '$1$2')
                .replace(/(<\/.*>)\s*(<.*>)/gm, '$1$2');
            return $.trim(toret);*/
            return $('<div>').append(xml).html();
        }
    }
});