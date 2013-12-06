define([

], function() {
    
'use strict';


var INSERTION = function(implementation) {
    var toret = function(node) {
        var insertion = this.getNodeInsertion(node),
            nodeWasContained = this.document.containsNode(insertion.ofNode),
            nodeParent;
        if(!(this.document.containsNode(this))) {
            nodeParent = insertion.ofNode.parent();
        }
        implementation.call(this, insertion.ofNode.nativeNode);
        this.triggerChangeEvent(insertion.insertsNew ? 'nodeAdded' : 'nodeMoved', {node: insertion.ofNode}, nodeParent, nodeWasContained);
        return insertion.ofNode;
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

    after: INSERTION(function(nativeNode) {
        return this._$.after(nativeNode);
    }),

    before: INSERTION(function(nativeNode) {
        return this._$.before(nativeNode);
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
        return DocumentNode.prototype.detach.call(this);
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

    append: INSERTION(function(nativeNode) {
        this._$.append(nativeNode);
    }),

    prepend: INSERTION(function(nativeNode) {
        this._$.prepend(nativeNode);
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

        var prev = this.prev(),
            next = this.next(),
            moveLeftRange, moveRightRange, leftMerged;

        if(prev && (prev.nodeType === TEXT_NODE) && (myContents[0].nodeType === TEXT_NODE)) {
            prev.appendText(myContents[0].getText());
            myContents[0].detach();
            moveLeftRange = true;
            leftMerged = true;
        } else {
            leftMerged = false;
        }

        if(!(leftMerged && myContents.length === 1)) {
            var lastContents = _.last(myContents);
            if(next && (next.nodeType === TEXT_NODE) && (lastContents.nodeType === TEXT_NODE)) {
                next.prependText(lastContents.getText());
                lastContents.detach();
                moveRightRange = true;
            }
        }

        var childrenLength = this.contents().length;
        this.contents().forEach(function(child) {
            this.before(child);
        }.bind(this));

        this.detach();

        return {
            element1: parent.contents()[myIdx + (moveLeftRange ? -1 : 0)],
            element2: parent.contents()[myIdx + childrenLength-1 + (moveRightRange ? 1 : 0)]
        };
    },

    wrapText: function(params) {
        return this.document._wrapText(_.extend({inside: this}, params));
    }
};

var textNodeTransformations = {
    setText: function(text) {
        //console.log('smartxml: ' + text);
        this.nativeNode.data = text;
        this.triggerTextChangeEvent();
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
            return DocumentNode.prototype.wrapWith.call(this, desc);
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
        defineDocumentProperties(this, insertion.ofNode._$);
        insertion.ofNode.triggerChangeEvent('nodeAdded');
        return insertion.ofNode;
    }
}

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