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
                var metaData = commentNode.getMetadata(),
                    author, date, content;

                metaData.some(function(row) {
                    author = row.getValue();
                    if(author) {
                        author = author.split(' ')[0];
                    }
                    return true;
                }, 'creator');
                
                metaData.some(function(row) {
                    date = row.getValue();
                    return true;
                }, 'date');

                content = commentNode.object.getText();

                var commentView = $(_.template(commentTemplate)({
                    author: author ||'?',
                    date: date || '?',
                    content: content || '?'
                }));

                commentView.find('.remove-btn').on('click', function() {
                    commentNode.document.transaction(function() {
                        commentNode.detach();
                    }, {
                        metadata: {
                            description: gettext('Remove comment')
                        }
                    });
                });

                this.list.append(commentView);
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


return View;

});