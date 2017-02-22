define(function() {
    
'use strict';
/* globals gettext */

var footnoteExecute = {
    selecting: function(params) {
        var parent = params.fragment.startNode.parent();
        return parent.wrapText({
            _with: {tagName: 'aside', attrs: {'class': 'footnote'}},
            offsetStart: params.fragment.startOffset,
            offsetEnd: params.fragment.endOffset,
            textNodeIdx: [params.fragment.startNode.getIndex(), params.fragment.endNode.getIndex()]
        });
    },
    afterCursor: function(params) {
        var node = params.fragment.node,
            asideNode;
        node.document.transaction(function() {
            asideNode = node.divideWithElementNode({tagName: 'aside', attrs:{'class': 'footnote'}}, {offset: params.fragment.offset});
            asideNode.append({text: ''});
        });
        return asideNode;
    },
    afterNode: function(params) {
        var node = params.fragment.node,
            asideNode;
        node.document.transaction(function() {
            asideNode = node.after({tagName: 'aside', attrs:{'class': 'footnote'}}, {offset: params.fragment.offset});
            asideNode.append({text: ''});
        });
        return asideNode;
    }
};

var footnoteAction =  {
    name: 'footnote',
    params: {
        fragment: {type: 'context', name: 'fragment'}
    },
    stateDefaults: {
        icon: 'asterisk'
    },
    getState: function(params) {
        if(!params.fragment || !params.fragment.isValid()) {
            return {allowed: false};
        }
        if(params.fragment instanceof params.fragment.TextRangeFragment && params.fragment.hasSiblingBoundaries()) {
            return {
                allowed: true,
                description: gettext('Create footnote from selection'),
                execute: footnoteExecute.selecting
            };
        }
        if(params.fragment instanceof params.fragment.CaretFragment) {
            return {
                allowed: true,
                description: gettext('Insert footnote after cursor'),
                execute: footnoteExecute.afterCursor
            };
        }
        if(params.fragment instanceof params.fragment.NodeFragment) {
            if(params.fragment.node.isRoot()) {
                return {
                    allowed: false,
                    description: gettext('Cannot insert footnote after root node')
                };
            }
            return {
                allowed: true,
                description: gettext('Insert footnote after node'),
                execute: footnoteExecute.afterNode
            };
        }
        return false;
    }
};


return {
    actions: [footnoteAction],
};

});