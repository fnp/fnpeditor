//use case: edytor robi split, jesli split był na koncu (czyli druga czesc jest pusta)
// chce tam dodac wezel tekstowy

// flow: plugin_key_handler(enter, main-canvas-area) -> plugin_document_action('break-content')
// --w srodku--> refactoring tego co teraz w keyboard:

//1. jedna transformacja z warunkiem (Zarejestrowana przez plugin)



var breakContentTransformation = {
    impl: function(args) {
        var node = this.context;
            emptyText = false,
            newNodes,
            emptyNode;

        newNodes = node.transform('core.split', {offset: args.offset});

        if(args.offset === 0)
            emptyNode = newNodes.first;
        else if(args.offset === node.getText().length); //@ nie ma atEnd :(
            emptyNode = newNodes.second;
        
        if(emptyNode) {
            emptyText = emptyNode.transform('core.append', {text: ''});
        }

        return _.extend(newNodes, {emptyText: emptyText});
    }
};


var breakContentAction = function(document, context) {
    var textNode = context.currentTextNode;
    if(textNode) {
        var result, goto;

        result = textNode.transform('core.break-content', {offset: context.offset});

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

var toret = {
    keyHandlers: [
        {key: 'ENTER', target: 'main-document-area', handler: function(editor) {
            editor.getAction('core.break-document-content').execute();
        }},
    ],
    
    actions: [
        {name: 'core.break-document-content', context: 'main-document-area', action: breakContentAction}
    ],

    // zapisywanie dokumentu:

    contextTransformations: [
        {name: 'core.break-content', textNode: true, t: breakContentTransformation},

        // list plugin:
        {name: 'list.remove-list', elementNode: 'list', t: null}
        // hipotetyczna akcja na itemie listy
        {name: 'list.extract', elementNode: 'item', requiresParent: 'list', requiresInParents: '?'}
    ],

}


/// STARE

// 1. detach via totalny fallback
var DetachNodeTransformation = function(args) {
    this.node = args.node;
    this.document = this.node.document;
};
$.extend(DetachNodeTransformation.prototype, {
    run: function() {
        this.oldRoot = this.node.document.root.clone();
        this.path = this.node.getPath();
        this.node.detach(); // @TS
        
    },
    undo: function() {
        this.document.root.replaceWith(this.oldRoot); // this.getDocument?
        this.node = this.document.getNodeByPath(this.path);
    }
});
transformations['detach'] = DetachNodeTransformation;

//2. detach via wskazanie changeroot

var Detach2NodeTransformation = function(args) {
    this.nodePath = args.node.getPath();
    this.document = args.node.document;
};
$.extend(Detach2NodeTransformation.prototype, {
    run: function() {
        var node = this.document.getNodeByPath(this.nodePath),
            root = node.parent() ? node.parent() : this.document.root;
        
        this.rootPath = root.getPath();
        this.oldRoot = (root).clone();
        node.detach();
    },
    undo: function() {
        this.document.getNodeByPath(this.rootPath).replaceWith(this.oldRoot);
    }
});
//transformations['detach2'] = Detach2NodeTransformation;

//2a. generyczna transformacja

var createTransformation = function(desc) {

    var NodeTransformation = function(args) {
        this.nodePath = args.node.getPath();
        this.document = args.node.document;
        this.args = args;
    };
    $.extend(NodeTransformation.prototype, {
        run: function() {
            var node = this.document.getNodeByPath(this.nodePath),
                root;

            if(desc.getRoot) {
                root = desc.getRoot(node);
            } else {
                root = this.document.root;
            }
            
            this.rootPath = root.getPath();
            this.oldRoot = (root).clone();
            desc.impl.call(node, this.args);
        },
        undo: function() {
            this.document.getNodeByPath(this.rootPath).replaceWith(this.oldRoot);
        }
    });

    return NodeTransformation;
}



var contextTransformations = {};
contextTransformations['setText'] = createContextTransformation({
    impl: function(args) {
        this.setText(args.text);
    },
    getChangeRoot: function() {
        return this.context;
    }
});

contextTransformations['setAttr'] = createContextTransformation({
    impl: function(args) {
        this.setAttr(args.name, args.value);
    },
    getChangeRoot: function() {
        return this.context;
    }
});

contextTransformations['split'] = createContextTransformation({
    impl: function(args) {
        return this.split({offset: args.offset});
    }//,
    // getChangeRoot: function() {
    //     return this.context.parent().parent();
    // }
});


contextTransformations['before'] = createContextTransformation({
    getChangeRoot: function() {
        return this.context.parent();
    },
    impl: function(args) {
        this.before(args.node)
    },

});

contextTransformations['before'] = createContextTransformation({
    impl: function(args) {
        this.before(args.node)
    },
    undo: function() {
        this.context.detach();
    }
});



transformations['detach2'] = createTransformation({
    // impl: function() {
    //     //this.setAttr('class', 'cite'); //  
    // },
    impl: ElementNode.prototype.detach,
    getRoot: function(node) {
        return node.parent();
    }

});

transformations['setText-old'] = createTransformation({
    impl: function(args) {
        this.setText(args.text)
    },
    getRoot: function(node) {
        return node;
    }

});

transformations['setClass-old'] = createTransformation({
    impl: function(args) {
        this.setClass(args.klass);
    },
    getRoot: function(node) {
        return node;
    }
})

//3. detach z pełnym własnym redo

var Detach3NodeTransformation = function(args) {
    this.node = args.node;
    this.document = this.node.document;
};
$.extend(Detach3NodeTransformation.prototype, {
    run: function() {
        //this.index = this.node.getIndex();
        //this.parent = this.node.parent();
        
        this.path = this.node.getPath();
        if(this.node.isSurroundedByTextElements()) {
            this.prevText = this.node.prev().getText();
            this.nextText = this.node.next().getText();
            this.merge = true;
        } else {
            this.prevText = this.nextText = null;
            this.merge = false;
        }

        this.node.detach();
    },
    undo: function() {
        var parent = this.document.getNodeByPath(this.path.slice(0,-1)),
            idx = _.last(this.path);
        var inserted = parent.insertAtIndex(this.node, idx);
        if(this.merge) {
            if(inserted.next()) {
                inserted.before({text: this.prevText});
                inserted.next().setText(this.nextText);
            } else {
                inserted.prev().setText(this.prevText);
                inserted.after({text: this.nextText});
            }
        }
    }
});
transformations['detach3'] = Detach3NodeTransformation;


var registerTransformationsFromObject = function(object) {
    _.pairs(object).filter(function(pair) {
        var property = pair[1];
        return typeof property === 'function' && property._isTransformation;
    })
    .forEach(function(pair) {
        var name = pair[0],
            method = pair[1];
        object.registerTransformation(name, createContextTransformation(method));
    });
};
registerTransformationsFromObject(ElementNode.prototype);
registerTransformationsFromObject(TextNode.prototype);
registerTransformationsFromObject(Document.prototype);