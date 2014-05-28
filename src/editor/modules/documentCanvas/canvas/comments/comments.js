define(function(require) {
    
'use strict';
/* globals Node, gettext */


var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    datetime = require('fnpjs/datetime'),
    commentsTemplate = require('libs/text!./comments.html'),
    commentTemplate = require('libs/text!./comment.html');


var View = function(node, user) {
    this.node = node;
    this.user = user;
    this.dom = $(_.template(commentsTemplate)());
    this.list = this.dom.find('.list');
    this.textarea = this.dom.find('textarea');
    this.addButton = this.dom.find('button.btnAdd');
    this.cancelButton = this.dom.find('button.btnCancel');

    this.textarea.on('input', function() {
        this.addButton.attr('disabled', this.textarea.val() === '');

        if (this.textarea.prop('scrollHeight') > this.textarea.prop('clientHeight')) {
            this.textarea.height(this.textarea.prop('scrollHeight'));
        }


    }.bind(this));
    this.addButton.hide();
    this.cancelButton.hide();
    this.textarea.on('focus', function() {
        this.addButton.show();
        this.cancelButton.show();
    }.bind(this));

    this.addButton.on('click', function() {
        if(!this.node) {
            return;
        }

        this.node.document.transaction(function() {
            var commentNode = this.node.document.createDocumentNode({tagName: 'aside', attrs: {'class': 'comment'}}),
                metadata = commentNode.getMetadata(),
                creator;

            if(this.user) {
                creator = this.user.name;
                if(this.user.email) {
                    creator += ' (' + this.user.email + ')';
                }
            } else {
                creator = 'anonymous';
            }

            metadata.add({key: 'creator', value: creator});
            metadata.add({key: 'date', value: datetime.currentStrfmt()});
            commentNode.append({text: this.textarea.val()});

            this.node.append(commentNode);
        }.bind(this), {
            metadata: {
                description: gettext('Add comment')
            },
            success: function() {
                this.textarea.val('');
            }.bind(this)
        });

    }.bind(this));

    this.cancelButton.on('click', function() {
        this.addButton.hide();
        this.cancelButton.hide();
        this.textarea.val('');
    }.bind(this));

    this.render();
    this.onDeactivated();

};

_.extend(View.prototype, {
    render: function() {
        this.list.empty();

        // while(this.node.getTagName() === 'span' && this.node.parent()) {
        //     this.node = this.node.parent();
        // }
        this.textarea.attr('placeholder', gettext('Comment'));

        this.node.contents()
            .filter(function(child) {
                return child.nodeType === Node.ELEMENT_NODE && child.getTagName() === 'aside' && child.getClass() === 'comment';
                //return child.is({tag: 'aside', klass: 'comment'});

            })
            .forEach(function(commentNode) {
                var commentView = new CommentView(commentNode);
                this.list.append(commentView.dom);
                this.textarea.attr('placeholder', gettext('Respond') + '...');
            }.bind(this));
        
    },
    onActivated: function() {
        //if(this.list.find('.comment').length === 0) {
            this.dom.find('.newComment').toggle(true);
        //}
       //this.dom.show();

    },
    onDeactivated: function() {
      this.dom.find('.newComment').toggle(false);
      this.addButton.hide();
      this.cancelButton.hide();
      //this.dom.hide();

    },

    getHeight: function() {
        return this.dom.outerHeight();
    }

});


var CommentView = function(commentNode) {
    this.node = commentNode;

    var metaData = this.node.getMetadata(),
        author, date;

    metaData.some(function(row) {
        author = row.getValue();
        if(author) {
            author = author.split(' ')[0];
        }
        return true;
    }, 'creator');
    
    metaData.some(function(row) {
        date = row.getValue();
        if(/[0-9][0-9]:[0-9][0-9]:[0-9][0-9]$/g.test(date)) {
            date = date.split(':');
            date.pop();
            date = date.join(':');
        }
        return true;
    }, 'date');

    this.dom = $(_.template(commentTemplate)({
        author: author ||'?',
        date: date || '?',
        content: this.node.object.getText() || '?'
    }));

    this.contentElement = this.dom.find('.content');
    this.editElement = this.dom.find('.edit');
    this.deleteDialogElement = this.dom.find('.deleteDialog');

    this.dom.find('.remove-btn').on('click', function() {
        this.deleteDialogElement.show();
    }.bind(this));

    this.dom.find('.deleteDialog-confirm').on('click', function() {
        this.node.document.transaction(function() {
            this.node.detach();
        }.bind(this), {
            metadata: {
                description: gettext('Remove comment')
            }
        });
    }.bind(this));

    this.dom.find('.deleteDialog-cancel').on('click', function() {
        this.deleteDialogElement.hide();
    }.bind(this));

    this.dom.find('.edit-start-btn').on('click', function() {
        this.startEditing();
    }.bind(this));

    this.dom.find('.edit-save-btn').on('click', function() {
        this.saveEditing();
    }.bind(this));

    this.dom.find('.edit-cancel-btn').on('click', function() {
        this.cancelEditing();
    }.bind(this));

    this.textarea = this.editElement.find('textarea');
    this.textarea.on('input', function() {
        this.dom.find('.edit-save-btn').attr('disabled', this.textarea.val() === '');

        if (this.textarea.prop('scrollHeight') > this.textarea.prop('clientHeight')) {
            this.textarea.height(this.textarea.prop('scrollHeight'));
        }


    }.bind(this));
};

$.extend(CommentView.prototype, {
    startEditing: function() {
        this.contentElement.hide();
        this.editElement.show();
        this.textarea.val(this.node.object.getText());
        if(this.textarea.prop('scrollHeight') > this.textarea.prop('clientHeight')) {
            this.textarea.height(this.textarea.prop('scrollHeight'));
        }
        this.textarea.focus();
    },
    saveEditing: function() {
        var newContent = this.editElement.find('textarea').val();
        this.node.document.transaction(function() {
            this.node.object.setText(newContent);
        }.bind(this), {
            metadata: {
                description: gettext('Edit comment')
            }
        });
    },
    cancelEditing: function() {
        this.contentElement.show();
        this.editElement.find('textarea').val('');
        this.editElement.hide();
    },
});


return View;

});