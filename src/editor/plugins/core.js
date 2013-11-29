define([

], function() {
    
'use strict';

var breakContentTransformation = {
    impl: function(args) {
        var node = this.context,
            newNodes, emptyNode, emptyText;
        newNodes = node.transform('smartxml.split', {offset: args.offset});
        [newNodes.first, newNodes.second].some(function(newNode) {
            if(!(newNode.contents().length)) {
                newNode.transform('smartxml.append', {text: ''});
                return true; // break
            }
        });
        return _.extend(newNodes, {emptyText: emptyText});
    },
    isAllowed: function() {

    }
};


var breakContentAction = function(document, context) {
    var textNode = context.cursor.currentNode;
    if(textNode) {
        var result, goto;

        result = textNode.transform('core.break-content', {offset: context.cursor.offset});

        if(result.emptyText) {
            goto = result.createdEmpty;
            gotoOptions = {};
        } else {
            goto = result.second;
            gotoOptions = {caretTo: 'start'};   
        }

        context.setCurrentElement(goto, gotoOptions);
    }
}
breakContentAction.isAllowed = function(document, context) {
    /* globals Node */
    var node = context.cursor.currentNode;
    return node.nodeType === Node.TEXT_NODE;
}

return {
    keyHandlers: [
        {key: 'ENTER', target: 'main-document-area', handler: function(editor) {
            var action = editor.getAction('core.break-document-content');
            if(action.isAllowed()) {
                action.execute();
            }
        }},
        {key: 'ENTER', target: 'main-document-area', actionHandler: 'core.break-document-content'}
    ],
    
    documentActions: [
        {
            name: 'core.break-document-content',
            context: 'main-document-area',
            label: 'break here'
            icon: 'core:some-name',
            action: breakContentAction
        }
    ],

    // zapisywanie dokumentu:

    documentTransformations: [
        {name: 'core.break-content', textNode: true, t: breakContentTransformation},

        // transformacja z poziomu smartxml
        {name: 'core.wrap-with', textNode: true, t: wrapWith}

        // list plugin:
        {name: 'list.remove-list', elementNode: 'list', t: null}
        // hipotetyczna akcja na itemie listy
        {name: 'list.extract', elementNode: 'item', requiresParent: 'list', requiresInParents: '?'}
    ]
};

});