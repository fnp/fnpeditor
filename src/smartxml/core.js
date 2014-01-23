define(function(require) {
    
'use strict';
/* globals Node */

var _ = require('libs/underscore');


var INSERTION = function(implementation) {
    var toret = function(node, options) {
        var insertion = this.getNodeInsertion(node),
            nodeWasContained = this.document.containsNode(insertion.ofNode),
            nodeParent,
            returned;
        options = options || {};
        if(!(this.document.containsNode(this))) {
            nodeParent = insertion.ofNode.parent();
        }
        returned = implementation.call(this, insertion.ofNode);
        if(!options.silent && returned.sameNode(insertion.ofNode)) {
            this.triggerChangeEvent(insertion.insertsNew ? 'nodeAdded' : 'nodeMoved', {node: insertion.ofNode}, nodeParent, nodeWasContained);
        }
        return returned;
    };
    return toret;
};

var documentNodeTransformations = {
    detach: function() {
        var parent = this.parent();
        this._$.detach();
        this.triggerChangeEvent('nodeDetached', {parent: parent});
        return this;
    },

    replaceWith: function(node) {
        var toret;
        if(this.isRoot()) {
            return this.document.replaceRoot(node);
        }
        toret = this.after(node);
        this.detach();
        return toret;
    },

    after: INSERTION(function(node) {
        var next = this.next();
        if(next && next.nodeType === Node.TEXT_NODE && node.nodeType === Node.TEXT_NODE) {
            next.setText(node.getText() + next.getText());
            return next;
        }
        this._$.after(node.nativeNode);
        return node;
    }),

    before: INSERTION(function(node) {
        var prev = this.prev();
        if(prev && prev.nodeType === Node.TEXT_NODE && node.nodeType === Node.TEXT_NODE) {
            prev.setText(prev.getText() + node.getText());
            return prev;
        }
        this._$.before(node.nativeNode);
        return node;
    }),

    wrapWith: function(node) {
        var insertion = this.getNodeInsertion(node);
        if(this.parent()) {
            this.before(insertion.ofNode);
        }
        insertion.ofNode.append(this);
        return insertion.ofNode;
    },

    /**
    * Removes parent of a node if node has no siblings.
    */
    unwrap: function() {
        if(this.isRoot()) {
            return;
        }
        var parent = this.parent(),
            grandParent;
        if(parent.contents().length === 1) {
            grandParent = parent.parent();
            parent.unwrapContent();
            return grandParent;
        }
    }
};

var elementNodeTransformations = {

    detach: function() {
        var next;
        if(this.parent() && this.isSurroundedByTextElements()) {
            next = this.next();
            this.prev().appendText(next.getText());
            next.detach();
        }
        return this.__super__.detach();
    },

    setTag: function(tagName) {
        var node = this.document.createDocumentNode({tagName: tagName}),
            oldTagName = this.getTagName(),
            myContents = this._$.contents();

        this.getAttrs().forEach(function(attribute) {
            node.setAttr(attribute.name, attribute.value, true);
        });
        node.setData(this.getData());

        if(this.sameNode(this.document.root)) {
            this.document._defineDocumentProperties(node._$);
        }

        /* TODO: This invalidates old references to this node. Caching instances on nodes would fix this. */
        this._$.replaceWith(node._$);
        this._setNativeNode(node._$[0]);
        this._$.append(myContents);
        this.triggerChangeEvent('nodeTagChange', {oldTagName: oldTagName, newTagName: this.getTagName()});
    },


    setAttr: function(name, value, silent) {
        var oldVal = this.getAttr(name);
        this._$.attr(name, value);
        if(!silent) {
            this.triggerChangeEvent('nodeAttrChange', {attr: name, oldVal: oldVal, newVal: value});
        }
    },

    append: INSERTION(function(node) {
        var last = _.last(this.contents());
        if(last && last.nodeType === Node.TEXT_NODE && node.nodeType === Node.TEXT_NODE) {
            last.setText(last.getText() + node.getText());
            return last;
        } else {
            this._$.append(node.nativeNode);
            return node;
        }
    }),

    prepend: INSERTION(function(node) {
        var first = this.contents()[0];
        if(first && first.nodeType === Node.TEXT_NODE && node.nodeType === Node.TEXT_NODE) {
            first.setText(node.getText() + first.getText());
            return first;
        } else {
            this._$.prepend(node.nativeNode);
            return node;
        }
    }),

    insertAtIndex: function(nativeNode, index) {
        var contents = this.contents();
        if(index < contents.length) {
            return contents[index].before(nativeNode);
        } else if(index === contents.length) {
            return this.append(nativeNode);
        }
    },

    unwrapContent: function() {
        var parent = this.parent();
        if(!parent) {
            return;
        }

        var myContents = this.contents(),
            myIdx = parent.indexOf(this);


        if(myContents.length === 0) {
            return this.detach();
        }


        var childrenLength = this.contents().length,
            first = true,
            shiftRange = false;
        this.contents().forEach(function(child) {
            var returned = this.before(child);
            if(first && !(returned.sameNode(child))) {
                shiftRange = true;
                first = false;
            }
        }.bind(this));

        this.detach();

        return {
            element1: parent.contents()[myIdx + (shiftRange ? -1 : 0)],
            element2: parent.contents()[myIdx + childrenLength-1 + (shiftRange ? -1 : 0)]
        };
    },

    wrapText: function(params) {
        return this.document._wrapText(_.extend({inside: this}, params));
    }
};

var textNodeTransformations = {
    setText: {
        impl: function(t, text) {
            t.oldText = this.getText();
            this.nativeNode.data = text;
            this.triggerTextChangeEvent();
        },
        undo: function(t) {
            this.setText(t.oldText);
        }
    },

    before: INSERTION(function(node) {
        if(node.nodeType === Node.TEXT_NODE) {
            this.prependText(node.getText());
            return this;
        } else {
            return this.__super__.before(node, {silent:true});
        }
    }),

    after: INSERTION(function(node) {
        if(node.nodeType === Node.TEXT_NODE) {
            this.appendText(node.getText());
            return this;
        } else {
            return this.__super__.after(node, {silent:true});
        }
    }),

    appendText: function(text) {
        this.nativeNode.data = this.nativeNode.data + text;
        this.triggerTextChangeEvent();
    },

    prependText: function(text) {
        this.nativeNode.data = text + this.nativeNode.data;
        this.triggerTextChangeEvent();
    },

    wrapWith: function(desc) {
        if(typeof desc.start === 'number' && typeof desc.end === 'number') {
            return this.document._wrapText({
                inside: this.parent(),
                textNodeIdx: this.parent().indexOf(this),
                offsetStart: Math.min(desc.start, desc.end),
                offsetEnd: Math.max(desc.start, desc.end),
                _with: {tagName: desc.tagName, attrs: desc.attrs}
            });
        } else {
            return this.__super__.wrapWith.call(this, desc);
        }
    },

    split: function(params) {
        var parentElement = this.parent(),
            passed = false,
            succeedingChildren = [],
            prefix = this.getText().substr(0, params.offset),
            suffix = this.getText().substr(params.offset);

        parentElement.contents().forEach(function(child) {
            if(passed) {
                succeedingChildren.push(child);
            }
            if(child.sameNode(this)) {
                passed = true;
            }
        }.bind(this));

        if(prefix.length > 0) {
            this.setText(prefix);
        }
        else {
            this.detach();
        }

        var attrs = {};
        parentElement.getAttrs().forEach(function(attr) {attrs[attr.name] = attr.value; });
        var newElement = this.document.createDocumentNode({tagName: parentElement.getTagName(), attrs: attrs});
        parentElement.after(newElement);

        if(suffix.length > 0) {
            newElement.append({text: suffix});
        }
        succeedingChildren.forEach(function(child) {
            newElement.append(child);
        });

        return {first: parentElement, second: newElement};
    },

    divideWithElementNode: function(node, params) {
        var insertion = this.getNodeInsertion(node),
            myText = this.getText();

        if(params.offset === myText.length) {
            return this.after(node);
        }
        if(params.offset === 0) {
            return this.before(node);
        }

        var lhsText = myText.substr(0, params.offset),
            rhsText = myText.substr(params.offset),
            rhsTextNode = this.document.createDocumentNode({text: rhsText});

        this.setText(lhsText);
        this.after(insertion.ofNode);
        insertion.ofNode.after(rhsTextNode);
        return insertion.ofNode;
    }
};

var documentTransformations = {
    wrapNodes: function(params) {
        if(!(params.node1.parent().sameNode(params.node2.parent()))) {
            throw new Error('Wrapping non-sibling nodes not supported.');
        }

        var parent = params.node1.parent(),
            parentContents = parent.contents(),
            wrapper = this.createDocumentNode({
                tagName: params._with.tagName,
                attrs: params._with.attrs}),
            idx1 = parent.indexOf(params.node1),
            idx2 = parent.indexOf(params.node2);

        if(idx1 > idx2) {
            var tmp = idx1;
            idx1 = idx2;
            idx2 = tmp;
        }

        var insertingMethod, insertingTarget;
        if(idx1 === 0) {
            insertingMethod = 'prepend';
            insertingTarget = parent;
        } else {
            insertingMethod = 'after';
            insertingTarget = parentContents[idx1-1];
        }

        for(var i = idx1; i <= idx2; i++) {
            wrapper.append(parentContents[i].detach());
        }

        insertingTarget[insertingMethod](wrapper);
        return wrapper;
    },

    _wrapText: function(params) {
        params = _.extend({textNodeIdx: 0}, params);
        if(typeof params.textNodeIdx === 'number') {
            params.textNodeIdx = [params.textNodeIdx];
        }
        
        var contentsInside = params.inside.contents(),
            idx1 = Math.min.apply(Math, params.textNodeIdx),
            idx2 = Math.max.apply(Math, params.textNodeIdx),
            textNode1 = contentsInside[idx1],
            textNode2 = contentsInside[idx2],
            sameNode = textNode1.sameNode(textNode2),
            prefixOutside = textNode1.getText().substr(0, params.offsetStart),
            prefixInside = textNode1.getText().substr(params.offsetStart),
            suffixInside = textNode2.getText().substr(0, params.offsetEnd),
            suffixOutside = textNode2.getText().substr(params.offsetEnd)
        ;

        if(!(textNode1.parent().sameNode(textNode2.parent()))) {
            throw new Error('Wrapping text in non-sibling text nodes not supported.');
        }
        
        var wrapperElement = this.createDocumentNode({tagName: params._with.tagName, attrs: params._with.attrs});
        textNode1.after(wrapperElement);
        textNode1.detach();
        
        if(prefixOutside.length > 0) {
            wrapperElement.before({text:prefixOutside});
        }
        if(sameNode) {
            var core = textNode1.getText().substr(params.offsetStart, params.offsetEnd - params.offsetStart);
            wrapperElement.append({text: core});
        } else {
            textNode2.detach();
            if(prefixInside.length > 0) {
                wrapperElement.append({text: prefixInside});
            }
            for(var i = idx1 + 1; i < idx2; i++) {
                wrapperElement.append(contentsInside[i]);
            }
            if(suffixInside.length > 0) {
                wrapperElement.append({text: suffixInside});
            }
        }
        if(suffixOutside.length > 0) {
            wrapperElement.after({text: suffixOutside});
        }
        return wrapperElement;
    },
    replaceRoot: function(node) {
        var insertion = this.getNodeInsertion(node);
        this.root.detach();
        this._defineDocumentProperties(insertion.ofNode._$);
        insertion.ofNode.triggerChangeEvent('nodeAdded');
        return insertion.ofNode;
    }
};

return {
    document: {
        transformations: documentTransformations
    },
    documentNode: {
        transformations: documentNodeTransformations
    },
    elementNode: {
        transformations: elementNodeTransformations
    },
    textNode: {
        transformations: textNodeTransformations
    }
};

});