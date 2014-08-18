define(function(require) {
    
'use strict';

var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    documentElement = require('./documentElement'),
    CommentsView = require('./comments/comments');


var DocumentNodeElement = documentElement.DocumentNodeElement;

var generic = Object.create(DocumentNodeElement.prototype);

$.extend(generic, {
    init: function() {
        DocumentNodeElement.prototype.init.call(this);
        this._container()
            .attr('wlxml-tag', this.wlxmlNode.getTagName())
            .attr('wlxml-class', this.wlxmlNode.getClass().replace(/\./g, '-'));

        this.container = this.createContainer(this.wlxmlNode.contents(), {
            manages: function(node) { return !node.isInside('comment'); },
            dom: this._container(),
            mirrors: this.mirror
        });

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
        if(this.wlxmlNode.getTagName() === 'span' || this.wlxmlNode.getTagName() === 'aside') {
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
        return this.container.getFirst(e1, e2);
    },

    containsBlock: function() {
        return this.container.containsBlock();
    },

    children: function() {
        return this.container.children();
    },

    getVerticallyFirstTextElement: function(params) {
        return this.container.getVerticallyFirstTextElement(params);
    },

    onNodeAdded: function(event) {
        if(event.meta.node.is('comment')) {
            this.commentTip.show();
            this.commentsView.render();
        }
    },

    onNodeDetached: function(event) {
        var isComment = event.meta.node.is('comment');
        if(event.meta.node.sameNode(this)) {
            // defacto jestesmy rootem?
            this.detach();
        } else {
            if(isComment && !this.wlxmlNode.hasChild({klass: 'comment'})) {
                this.commentTip.hide();
            }
            this.commentsView.render();
        }
    },

    onNodeTextChange: function(event) {
        var node = event.meta.node;

        /* TODO: This handling of changes to the comments should probably be implemented via separate,
        non-rendering comments element */
        if(node.parent() && node.parent().is('comment') && this.wlxmlNode.sameNode(node.parent().parent())) {
            this.commentsView.render();
        }
    },

    onStateChange: function(changes) {
        var isSpan = this.wlxmlNode.getTagName() === 'span';
        if(_.isBoolean(changes.exposed) && !isSpan) {
            this._container().toggleClass('highlighted-element', changes.exposed);
        }
        if(_.isBoolean(changes.active) && !isSpan) {
            this._container().toggleClass('current-node-element', changes.active);
        }
    },
});


return generic;



});