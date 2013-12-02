define([
    'libs/jquery',
    'libs/underscore',
    'libs/backbone',
    'smartxml/events'
], function($, _, Backbone, events) {
    
'use strict';
/* globals Node */

var TEXT_NODE = Node.TEXT_NODE;


var INSERTION = function(implementation) {
    var toret = function(node) {
        var insertion = this.getNodeInsertion(node),
            nodeParent;
        if(!(this.document.containsNode(this))) {
            nodeParent = insertion.ofNode.parent();
        }
        implementation.call(this, insertion.ofNode.nativeNode);
        this.triggerChangeEvent(insertion.insertsNew ? 'nodeAdded' : 'nodeMoved', {node: insertion.ofNode}, nodeParent);
        return insertion.ofNode;
    };
    return toret;
};

var DocumentNode = function(nativeNode, document) {
    if(!document) {
        throw new Error('undefined document for a node');
    }
    this.document = document;
    this._setNativeNode(nativeNode);

};

$.extend(DocumentNode.prototype, {
    _setNativeNode: function(nativeNode) {
        this.nativeNode = nativeNode;
        this._$ = $(nativeNode);
    },

    clone: function() {
        return this.document.createDocumentNode(this._$.clone(true, true)[0]);
    },

    getPath: function(ancestor) {
        var nodePath = [this].concat(this.parents()),
            toret, idx;
        ancestor = ancestor || this.document.root;

        nodePath.some(function(node, i) {
            if(node.sameNode(ancestor)) {
                idx = i;
                return true;
            }
        });

        if(idx !== 'undefined') {
            nodePath = nodePath.slice(0, idx);
        }
        toret = nodePath.map(function(node) {return node.getIndex(); });
        toret.reverse();
        return toret;
    },

    isRoot: function() {
        return this.document.root.sameNode(this);
    },

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

    sameNode: function(otherNode) {
        return !!(otherNode) && this.nativeNode === otherNode.nativeNode;
    },

    parent: function() {
        var parentNode = this.nativeNode.parentNode;
        if(parentNode && parentNode.nodeType === Node.ELEMENT_NODE) {
            return this.document.createDocumentNode(parentNode);
        }
        return null;
    },

    parents: function() {
        var parent = this.parent(),
            parents = parent ? parent.parents() : [];
        if(parent) {
            parents.unshift(parent);
        }
        return parents;
    },

    prev: function() {
        var myIdx = this.getIndex();
        return myIdx > 0 ? this.parent().contents()[myIdx-1] : null;
    },

    next: function() {
        if(this.isRoot()) {
            return null;
        }
        var myIdx = this.getIndex(),
            parentContents = this.parent().contents();
        return myIdx < parentContents.length - 1 ? parentContents[myIdx+1] : null;
    },

    isSurroundedByTextElements: function() {
        var prev = this.prev(),
            next = this.next();
        return prev && (prev.nodeType === Node.TEXT_NODE) && next && (next.nodeType === Node.TEXT_NODE);
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
    },

    triggerChangeEvent: function(type, metaData, origParent) {
        var node = (metaData && metaData.node) ? metaData.node : this,
            event = new events.ChangeEvent(type, $.extend({node: node}, metaData || {}));
        if(type === 'nodeDetached' || this.document.containsNode(event.meta.node)) {
            this.document.trigger('change', event);
        }
        if((type === 'nodeAdded' || type === 'nodeMoved') && !(this.document.containsNode(this))) {
             event = new events.ChangeEvent('nodeDetached', {node: node, parent: origParent});
             this.document.trigger('change', event);
        }
    },
    
    getNodeInsertion: function(node) {
        return this.document.getNodeInsertion(node);
    },

    getIndex: function() {
        if(this.isRoot()) {
            return 0;
        }
        return this.parent().indexOf(this);
    }
});

var ElementNode = function(nativeNode, document) {
    DocumentNode.call(this, nativeNode, document);
};
ElementNode.prototype = Object.create(DocumentNode.prototype);

$.extend(ElementNode.prototype, {
    nodeType: Node.ELEMENT_NODE,

    detach: function() {
        var next;
        if(this.parent() && this.isSurroundedByTextElements()) {
            next = this.next();
            this.prev().appendText(next.getText());
            next.detach();
        }
        return DocumentNode.prototype.detach.call(this);
    },

    setData: function(key, value) {
        if(value !== undefined) {
            this._$.data(key, value);
        } else {
            this._$.removeData(_.keys(this._$.data()));
            this._$.data(key);
        }
    },

    getData: function(key) {
        if(key) {
            return this._$.data(key);
        }
        return this._$.data();
    },

    getTagName: function() {
        return this.nativeNode.tagName.toLowerCase();
    },

    contents: function() {
        var toret = [],
            document = this.document;
        this._$.contents().each(function() {
            toret.push(document.createDocumentNode(this));
        });
        return toret;
    },

    indexOf: function(node) {
        return this._$.contents().index(node._$);
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
            defineDocumentProperties(this.document, node._$);
        }
        this._$.replaceWith(node._$);
        this._setNativeNode(node._$[0]);
        this._$.append(myContents);
        this.triggerChangeEvent('nodeTagChange', {oldTagName: oldTagName, newTagName: this.getTagName()});
    },

    getAttr: function(name) {
        return this._$.attr(name);
    },

    setAttr: function(name, value, silent) {
        var oldVal = this.getAttr(name);
        this._$.attr(name, value);
        if(!silent) {
            this.triggerChangeEvent('nodeAttrChange', {attr: name, oldVal: oldVal, newVal: value});
        }
    },

    getAttrs: function() {
        var toret = [];
        for(var i = 0; i < this.nativeNode.attributes.length; i++) {
            toret.push(this.nativeNode.attributes[i]);
        }
        return toret;
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
    },

    toXML: function() {
        var wrapper = $('<div>');
        wrapper.append(this._getXMLDOMToDump());
        return wrapper.html();
    },
    
    _getXMLDOMToDump: function() {
        return this._$;
    }
});

var TextNode = function(nativeNode, document) {
    DocumentNode.call(this, nativeNode, document);
};
TextNode.prototype = Object.create(DocumentNode.prototype);

$.extend(TextNode.prototype, {
    nodeType: Node.TEXT_NODE,

    getText: function() {
        return this.nativeNode.data;
    },

    setText: function(text) {
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
    },

    triggerTextChangeEvent: function() {
        var event = new events.ChangeEvent('nodeTextChange', {node: this});
        this.document.trigger('change', event);
    }
});


var parseXML = function(xml) {
    return $($.trim(xml))[0];
};

var Document = function(xml) {
    this.loadXML(xml);
};

$.extend(Document.prototype, Backbone.Events, {
    ElementNodeFactory: ElementNode,
    TextNodeFactory: TextNode,

    createDocumentNode: function(from) {
        if(!(from instanceof Node)) {
            if(from.text !== undefined) {
                /* globals document */
                from = document.createTextNode(from.text);
            } else {
                var node = $('<' + from.tagName + '>');

                _.keys(from.attrs || {}).forEach(function(key) {
                    node.attr(key, from.attrs[key]);
                });

                from = node[0];
            }
        }
        var Factory;
        if(from.nodeType === Node.TEXT_NODE) {
            Factory = this.TextNodeFactory;
        } else if(from.nodeType === Node.ELEMENT_NODE) {
            Factory = this.ElementNodeFactory;
        }
        return new Factory(from, this);
    },

    loadXML: function(xml, options) {
        options = options || {};
        defineDocumentProperties(this, $(parseXML(xml)));
        if(!options.silent) {
            this.trigger('contentSet');
        }
    },

    toXML: function() {
        return this.root.toXML();
    },

    containsNode: function(node) {
        return this.root && (node.nativeNode === this.root.nativeNode || node._$.parents().index(this.root._$) !== -1);
    },

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

    getSiblingParents: function(params) {
        var parents1 = [params.node1].concat(params.node1.parents()).reverse(),
            parents2 = [params.node2].concat(params.node2.parents()).reverse(),
            noSiblingParents = null;

        if(parents1.length === 0 || parents2.length === 0 || !(parents1[0].sameNode(parents2[0]))) {
            return noSiblingParents;
        }

        var i;
        for(i = 0; i < Math.min(parents1.length, parents2.length); i++) {
            if(parents1[i].sameNode(parents2[i])) {
                continue;
            }
            break;
        }
        return {node1: parents1[i], node2: parents2[i]};
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

    trigger: function() {
        //console.log('trigger: ' + arguments[0] + (arguments[1] ? ', ' + arguments[1].type : ''));
        Backbone.Events.trigger.apply(this, arguments);
    },

    getNodeInsertion: function(node) {
        var insertion = {};
        if(node instanceof DocumentNode) {
            insertion.ofNode = node;
            insertion.insertsNew = !this.containsNode(node);
        } else {
          insertion.ofNode = this.createDocumentNode(node);
          insertion.insertsNew = true;
        }
        return insertion;
    },

    replaceRoot: function(node) {
        var insertion = this.getNodeInsertion(node);
        this.root.detach();
        defineDocumentProperties(this, insertion.ofNode._$);
        insertion.ofNode.triggerChangeEvent('nodeAdded');
        return insertion.ofNode;
    }
});

var defineDocumentProperties = function(doc, $document) {
    Object.defineProperty(doc, 'root', {get: function() {
        return doc.createDocumentNode($document[0]);
    }, configurable: true});
    Object.defineProperty(doc, 'dom', {get: function() {
        return $document[0];
    }, configurable: true});
};

return {
    documentFromXML: function(xml) {
        return new Document(xml);
    },

    elementNodeFromXML: function(xml) {
        return this.documentFromXML(xml).root;
    },

    Document: Document,
    DocumentNode: DocumentNode,
    ElementNode: ElementNode
};

});