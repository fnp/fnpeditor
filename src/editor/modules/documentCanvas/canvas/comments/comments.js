define(function(require) {
    
'use strict';
/* globals gettext */


var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    datetime = require('fnpjs/datetime'),
    commentsTemplate = require('libs/text!./comments.html'),
    commentTemplate = require('libs/text!./comment.html');


var makeAutoResizable = function(textarea) {
    textarea.on('input', function() {
        resize(textarea);
    });
};

var resize = function(textarea) {
    if(textarea.prop('scrollHeight') > textarea.prop('clientHeight')) {
        textarea.height(textarea.prop('scrollHeight'));
    }
};


var CommentsView = function(node, user) {
    this.node = node;
    this.user = user;
    this.dom = $(_.template(commentsTemplate)());
    this.list = this.dom.find('.list');
    this.textarea = this.dom.find('textarea');
    this.addButton = this.dom.find('button.btnAdd');
    this.cancelButton = this.dom.find('button.btnCancel');

    this.textarea.on('input', function() {
        this.addButton.attr('disabled', this.textarea.val() === '');
    }.bind(this));
    makeAutoResizable(this.textarea);

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

_.extend(CommentsView.prototype, {
    render: function() {
        this.list.empty();
        this.textarea.attr('placeholder', gettext('Comment'));

        this.node.contents()
            .filter(function(child) {
                return child.is({tag: 'aside', klass: 'comment'});
            })
            .forEach(function(commentNode) {
                var commentView = new CommentView(commentNode);
                this.list.append(commentView.dom);
                this.textarea.attr('placeholder', gettext('Respond') + '...');
            }.bind(this));
    },
    onActivated: function() {
            this.dom.find('.newComment').toggle(true);
    },
    onDeactivated: function() {
      this.dom.find('.newComment').toggle(false);
      this.addButton.hide();
      this.cancelButton.hide();
    },
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
    }.bind(this));
    makeAutoResizable(this.textarea);
};

$.extend(CommentView.prototype, {
    startEditing: function() {
        this.contentElement.hide();
        this.editElement.show();
        this.textarea.val(this.node.object.getText());
        resize(this.textarea);
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


return CommentsView;

});