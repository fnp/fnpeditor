define(function(require) {
    
'use strict';

var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    documentElement = require('./documentElement'),
    utils = require('./utils'),
    wlxmlUtils = require('utils/wlxml'),
    CommentsView = require('./comments/comments');

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
            .attr('wlxml-tag', this.wlxmlNode.getTagName())
            .attr('wlxml-class', this.wlxmlNode.getClass().replace(/\./g, '-'));

        this.wlxmlNode.contents().forEach(function(node) {
            var el = this.canvas.createElement(node);
            if(el.dom) {
                this._container().append(el.dom);
            }
        }.bind(this));

        this.commentsView = new CommentsView(this.wlxmlNode, this.canvas.metadata.user);
        this.addToGutter(this.commentsView);
        this.commentTip = $('<div class="comment-tip"><i class="icon-comment"></i></div>');
        this.addWidget(this.commentTip);

        if(!this.wlxmlNode.hasChild({klass: 'comment'})) {
            this.commentTip.hide();
        }

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

    getVerticallyFirstTextElement: function(params) {
        var toret;
        
        params = _.extend({
            considerChildren: true
        }, params);
        
        this.children().some(function(child) {
            if(child instanceof documentElement.DocumentTextElement) {
                toret = child;
                return true; // break
            } else if(params.considerChildren) {
                toret = child.getVerticallyFirstTextElement();
                if(toret) {
                    return true; // break
                }
            }
        });
        return toret;
    },

    onNodeAdded: function(event) {
        if(event.meta.node.isRoot()) {
            this.canvas.reloadRoot();
            return;
        }

        var ptr = event.meta.node.prev(),
            referenceElement, referenceAction, actionArg;
            
        while(ptr && !(referenceElement = utils.getElementForElementRootNode(ptr))) {
            ptr = ptr.prev();
        }

        if(referenceElement) {
            referenceAction = 'after';
        } else {
            referenceElement = this;
            referenceAction = 'prepend';
        }
      
        if(event.meta.move) {
            /* Let's check if this node had its own canvas element and it's accessible. */
            actionArg = utils.getElementForElementRootNode(event.meta.node);
        }
        if(!actionArg) {
            actionArg = event.meta.node;
        }

        referenceElement[referenceAction](actionArg);

        if(event.meta.node.is('comment')) {
            this.commentTip.show();
            this.commentsView.render();
        }
    },
    onNodeDetached: function(event) {
        var isComment = event.meta.node.is('comment');
        if(event.meta.node.sameNode(this)) {
            this.detach();
        } else {
            this.children().some(function(child) {
                if(child.wlxmlNode.sameNode(event.meta.node)) {
                    child.detach();
                    return true;
                }
            });
            if(isComment && !this.wlxmlNode.hasChild({klass: 'comment'})) {
                this.commentTip.hide();
            }
            this.commentsView.render();
        }
    },
    onNodeTextChange: function(event) {
        var node = event.meta.node,
            toSet = node.getText(),
            handled;
        
        handled = this.children().some(function(child) {
            if(child.wlxmlNode.sameNode(node)) {
                if(toSet === '') {
                    toSet = utils.unicode.ZWS;
                }
                if(toSet !== child.getText()) {
                    child.setText(toSet);
                }
                return true;
            }
        });

        if(!handled && node.parent() && node.parent().is('comment') && this.wlxmlNode.sameNode(node.parent().parent())) {
            this.commentsView.render();
        }
    },

    onStateChange: function(changes) {
        if(_.isBoolean(changes.exposed) && !this.isSpan()) {
            this._container().toggleClass('highlighted-element', changes.exposed);
        }
        if(_.isBoolean(changes.active) && !this.isSpan()) {
            this._container().toggleClass('current-node-element', changes.active);
        }
    },

    ///

    isSpan: function() {
        return this.wlxmlNode.getTagName() === 'span';
    },
    
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
        if(element.dom) {
            this._container().prepend(element.dom);
            this.refreshPath();
        }
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
    }
});


return generic;



});