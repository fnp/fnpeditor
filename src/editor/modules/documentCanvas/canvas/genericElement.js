define(function(require) {
    
'use strict';

var $ = require('libs/jquery'),
    documentElement = require('./documentElement'),
    utils = require('./utils'),
    wlxmlUtils = require('utils/wlxml');

var labelWidget = function(tag, klass) {
    return $('<span>')
        .addClass('canvas-widget canvas-widget-label')
        .text(wlxmlUtils.getTagLabel(tag) + (klass ? ' / ' + wlxmlUtils.getClassLabel(klass) : ''));
};
void(labelWidget); // for linters; labelWidget is unused on purpose for now

var DocumentNodeElement = documentElement.DocumentNodeElement;

var generic = Object.create(DocumentNodeElement.prototype);

$.extend(generic, {
    init: function() {
        DocumentNodeElement.prototype.init.call(this);
        this._container()
            .attr('wlxml-tag', this.wlxmlNode.getTagName());
        this.setWlxmlClass(this.wlxmlNode.getClass());
        this.wlxmlNode.contents().forEach(function(node) {
            this._container().append(this.canvas.createElement(node).dom);
        }.bind(this));
        this.refresh();
    },
    
    refresh: function() {
        if(this.wlxmlNode.getTagName() === 'span') {
            if(this.containsBlock()) {
                this.displayAsBlock();
            } else {
                this.displayInline();
            }
        } else {
            this.displayAsBlock();
        }
    },

    getFirst: function(e1, e2) {
        var idx1 = this.childIndex(e1),
            idx2 = this.childIndex(e2);
        if(e1 === null || e2 === null) {
            return undefined;
        }
        return idx1 <= idx2 ? e1: e2;
    },

    children: function() {
        var element = this,
            toret = [];
        this._container().contents().each(function() {
            var childElement = element.canvas.getDocumentElement(this);
            if(childElement === undefined) {
                return true;
            }

            toret.push(childElement);
        });
        return toret;
    },

    getVerticallyFirstTextElement: function() {
        var toret;
        this.children().some(function(child) {
            if(child instanceof documentElement.DocumentTextElement) {
                toret = child;
                return true; // break
            } else {
                toret = child.getVerticallyFirstTextElement();
                if(toret) {
                    return true; // break
                }
            }
        });
        return toret;
    },

    onNodeAttrChange: function(event) {
        if(event.meta.attr === 'class') {
            this.setWlxmlClass(event.meta.newVal); //
        }
    },
    onNodeAdded: function(event) {
        if(event.meta.node.isRoot()) {
            this.canvas.reloadRoot();
            return;
        }

        var nodeIndex = event.meta.node.getIndex(),
            referenceElement, referenceAction, actionArg;

        if(nodeIndex === 0) {
            referenceElement = this;
            referenceAction = 'prepend';
        } else {
            referenceElement = this.children()[nodeIndex-1];
            referenceAction = 'after';
        }
      
        if(event.meta.move) {
            /* Let's check if this node had its own canvas element and it's accessible. */
            actionArg = utils.getElementForElementRootNode(event.meta.node);
            if(actionArg && actionArg.sameNode(referenceElement)) {
                referenceElement = this.children()[nodeIndex];
            }
        }
        if(!actionArg) {
            actionArg = event.meta.node;
        }

        referenceElement[referenceAction](actionArg);
    },
    onNodeDetached: function(event) {
        if(event.meta.node.sameNode(this)) {
            this.detach();
        } else {
            this.children().some(function(child) {
                if(child.wlxmlNode.sameNode(event.meta.node)) {
                    child.detach();
                    return true;
                }
            });
        }
    },
    onNodeTextChange: function(event) {
        var toSet = event.meta.node.getText();
        this.children().some(function(child) {
            if(child.wlxmlNode.sameNode(event.meta.node)) {
                if(toSet === '') {
                    toSet = utils.unicode.ZWS;
                }
                if(toSet !== child.getText()) {
                    child.setText(toSet);
                }
                return true;
            }
        });
    },


    ///
    
    containsBlock: function() {
        return this.children()
            .filter(function(child) {
                return child instanceof documentElement.DocumentNodeElement;
            })
            .some(function(child) {
                if(child.isBlock()) {
                    return true;
                } else {
                    return child.containsBlock();
                }
            });
    },

    prepend: function(param) {
        var element;
        if(param instanceof documentElement.DocumentElement) {
            element = param;
        } else {
            element = this.canvas.createElement(param);
        }
        this._container().prepend(element.dom);
        this.refreshPath();
        return element;
    },

    childIndex: function(child) {
        var children = this.children(),
            toret = null;
        children.forEach(function(c, idx) {
            if(c.sameNode(child)) {
                toret = idx;
                return false;
            }
        });
        return toret;
    },

    getWlxmlClass: function() {
        var klass = this._container().attr('wlxml-class');
        if(klass) {
            return klass.replace(/-/g, '.');
        }
        return undefined;
    },
    setWlxmlClass: function(klass) {
        if(klass === this.getWlxmlClass()) {
            return;
        }
        if(klass) {
            this._container().attr('wlxml-class', klass.replace(/\./g, '-'));
        }
        else {
            this._container().removeAttr('wlxml-class');
        }
        this.refreshPath();
    }
});


return generic;



});