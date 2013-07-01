define(['libs/jquery-1.9.1.min', 'libs/chai'], function($, chai) {
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
            };
            
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
        },
        
        assertDomEqual: function(lhs, rhs) {
            lhs = lhs.clone();
            var rhsArr = $.parseHTML(rhs);
            if(rhsArr.length === 1) {
                rhs = $(rhsArr[0]);
            } else {
                rhs = $('<div>');
                $.each(rhsArr, function(i, el) {
                    rhs.append(el);
                });            
            }
            if(lhs.length > 1) {
                lhs = $('<div>').append(lhs);
            }
            lhs.attr('id', '');
            rhs.attr('id', '');
            lhs.find('*').each(function() {$(this).attr('id', '');});
            rhs.find('*').each(function() {$(this).attr('id', '');});
            return chai.assert.ok(lhs[0].isEqualNode(rhs[0]), 'nodes are equal');
        }
    };
});