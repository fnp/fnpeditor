define(function(require) {
    
'use strict';

var _ = require('libs/underscore'),
    plugin = {documentExtension: {textNode: {}}};


plugin.documentExtension.textNode.transformations = {
    breakContent: {
        impl: function(args) {
            var node = this,
                newNodes, emptyText;
            newNodes = node.split({offset: args.offset});
            [newNodes.first, newNodes.second].some(function(newNode) {
                if(!(newNode.contents().length)) {
                    emptyText = newNode.append({text: ''});
                    return true; // break
                }
            });
            return _.extend(newNodes, {emptyText: emptyText});
        },
        getChangeRoot: function() {
            return this.context.parent().parent();
        }
    },
    mergeContentUp: function() {
        var myPrev = this.prev(),
            ret;

        if(myPrev) {
            ret = myPrev.append(this);
            return {node: ret, offset: ret.sameNode(this) ? null : ret.getText().length - this.getText().length};
        } else {
            var range = this.parent().unwrapContent();
            return {node: range.element1, offset: 0};
        }
    }
};

return plugin;

});