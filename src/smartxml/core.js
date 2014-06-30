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
        if(!(this.document.containsNode(this)) || !insertion.insertsNew) {
            nodeParent = insertion.ofNode.parent();
        }
        if(!insertion.insertsNew && insertion.ofNode.isSurroundedByTextNodes()) {
            var prev = insertion.ofNode.prev(),
                next = insertion.ofNode.next();
            prev.setText(prev.getText()+next.getText());
            next.detach();
        }
        returned = implementation.call(this, insertion.ofNode);
        if(!options.silent && returned && returned.sameNode(insertion.ofNode)) {
            if(!insertion.insertsNew) {
                this.triggerChangeEvent('nodeDetached', {node: insertion.ofNode, parent: nodeParent, move: true});
            }
            this.triggerChangeEvent('nodeAdded', {node: insertion.ofNode, move: !insertion.insertsNew}, nodeParent, nodeWasContained);
        }
        return returned;
    };
    return toret;
};

var documentNodeTransformations = {
    detach: function() {
        var parent = this.parent(),
            existed = this.document.containsNode(this);
        this._$.detach();
        if(existed) {
            this.triggerChangeEvent('nodeDetached', {parent: parent});
            if(!parent) {
                // This was the root of the document
                this.document._defineDocumentProperties(null);
            }
        }
        return this;
    },

    replaceWith: function(node) {
        var toret;
        if(this.isRoot()) {
            return this.document.replaceRoot(node);
        }
        if(this.parent()) {
            toret = this.after(node);
            this.detach();
            return toret;
        }
        throw new Error('Cannot replace node without a parent.');
    },

    after: INSERTION(function(node) {
        if(this.isRoot()) {
            return;
        }
        var next = this.next();

        if(next && next.nodeType === Node.TEXT_NODE && node.nodeType === Node.TEXT_NODE) {
            next.setText(node.getText() + next.getText());
            node.detach();
            return next;
        }
        this._$.after(node.nativeNode);
        return node;
    }),

    before: INSERTION(function(node) {
        if(this.isRoot()) {
            return;
        }
        var prev = this.prev();
        if(prev && prev.nodeType === Node.TEXT_NODE && node.nodeType === Node.TEXT_NODE) {
            prev.setText(prev.getText() + node.getText());
            node.detach();
            return prev;
        }
        this._$.before(node.nativeNode);
        return node;
    }),

    wrapWith: function(node) {
        var insertion = this.getNodeInsertion(node);

        if(this.parent() || this.isRoot()) {
            this.replaceWith(insertion.ofNode);
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

    detach: function(params) {
        var next;
        params = _.extend({
            normalizeStrategy: 'merge'
        }, params);

        if(this.parent() && this.isSurroundedByTextNodes()) {
            if(params.normalizeStrategy === 'detach-left') {
                this.prev().detach();
            } else if(params.normalizeStrategy === 'detach-right') {
                this.next().detach();
            } else if(params.normalizeStrategy === 'merge') {
                next = this.next();
                this.prev().appendText(next.getText());
                next.detach();
            } else {
                throw new Error('unknown normalize strategy for detach');
            }
        }
        return this.__super__.detach();
    },

    setTag: function(tagName) {
        var node = this.document.createDocumentNode({tagName: tagName});

        this.getAttrs().forEach(function(attribute) {
            node.setAttr(attribute.name, attribute.value);
        });

        this.contents().forEach(function(child) {
            node.append(child);
        });

        node.setData(this.getData());

        this.replaceWith(node);
        return node;
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
            node.detach();
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
            node.detach();
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

        this.contents()
            .filter(function(child) {
                return child.getProperty('describesParent');
            }.bind(this))
            .forEach(function(child) {
                child.detach();
            });

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
            node.detach();
            return this;
        } else {
            return this.__super__.before(node, {silent:true});
        }
    }),

    after: INSERTION(function(node) {
        if(node.nodeType === Node.TEXT_NODE) {
            this.appendText(node.getText());
            node.detach();
            return this;
        } else {
            return this.__super__.after(node, {silent:true});
        }
    }),

    append: function(node) {
        if(node.nodeType === Node.TEXT_NODE) {
            this.appendText(node.getText());
            node.detach();
            return this;
        }
    },
    prepend: function(node) {
        if(node.nodeType === Node.TEXT_NODE) {
            this.prependText(node.getText());
            node.detach();
            return this;
        }
    },

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

        succeedingChildren.reverse().forEach(function(child) {
            newElement.prepend(child);
        });
        if(suffix.length > 0) {
            newElement.prepend({text: suffix});
        }

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
            if(!parentContents[i].getProperty('describesParent')) {
                wrapper.append(parentContents[i].detach());
            }
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
                if(!contentsInside[i].getProperty('describesParent')) {
                    wrapperElement.append(contentsInside[i]);
                }
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
    },
    deleteText: function(params) {
        var ptr, next, nextNext, toDetach, middle, text;

        if(params.from.node.sameNode(params.to.node)) {
            ptr = params.from.node;
            text = ptr.getText();
            ptr.setText(text.substr(0, params.from.offset) + text.substr(params.to.offset));
            return;
        }

        // Both edge text nodes need to be edited before anything else happen in case that
        // they get merged when detaching content between them.
        params.from.node.setText(params.from.node.getText().substr(0, params.from.offset));
        params.to.node.setText(params.to.node.getText().substr(params.to.offset));

        ptr = params.from.node;
        next = ptr.next();

        while(next || ptr.parent()) {
            if(next) {
                if(next.sameNode(params.to.node)) {
                    return;
                }
                else if(next.nodeType === Node.ELEMENT_NODE && next.containsNode(params.to.node)) {
                    middle = next;
                    break;
                } else {
                    toDetach = next;
                    next = next.next();
                    nextNext = next ? next.next() : null;
                    toDetach.detach({normalizeStrategy: (next && next.sameNode(params.to.node)) ? 'merge' : 'detach-right'});
                    if(next && !next.isInDocument()) {
                        next = nextNext;
                    }
                }
            } else {
                ptr = ptr.parent();
                next = ptr.next();
            }
        }

        if(!this.containsNode(params.to.node)) {
            // The end node was merged during detaching nodes above - there is nothing more left to do.
            return;
        }

        ptr = middle.contents()[0];
        while(ptr && !ptr.sameNode(params.to.node)) {
            if(ptr.nodeType === Node.ELEMENT_NODE && ptr.containsNode(params.to.node)) {
                ptr = ptr.contents()[0];
                continue;
            } else {
                ptr = ptr.next();
                ptr.prev().detach();
            }
        }
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