define(function(require) {
    
'use strict';
/* globals gettext */


var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    genericElement = require('modules/documentCanvas/canvas/genericElement'),
    Dialog = require('views/dialog/dialog'),
    boxTemplate = require('libs/text!./box.html'),
    linkElement = Object.create(genericElement);


_.extend(linkElement, {
    init: function() {
        genericElement.init.call(this);
        _.bindAll(this, 'changeLink', 'deleteLink');

        var linkText = this.wlxmlNode.getAttr('href') || '',
            linkUrl = this.getUrl(linkText);

        this.box = $(_.template(boxTemplate)({text: linkText, url: linkUrl}));
        this.box.find('.change').on('click', this.changeLink);
        this.box.find('.delete').on('click', this.deleteLink);
        this.box.hide();
        this.addWidget(this.box);
    },
    onStateChange: function(changes) {
        genericElement.onStateChange.call(this, changes);
        if(_.isBoolean(changes.active)) {
            this.box.toggle(changes.active);
        }
    },
    onNodeAttrChange: function(event) {
        if(event.meta.attr === 'href') {
            var link = this.box.find('[link]');
            link.text(event.meta.newVal);
            link.attr('href', this.getUrl(event.meta.newVal));
        }
    },

    changeLink: function(e) {
        var el = this,
            doc = this.wlxmlNode.document,
            offset = el.canvas.getSelection().toDocumentFragment().offset,
            dialog = Dialog.create({
            title: gettext('Edit link'),
            executeButtonText: gettext('Apply'),
            cancelButtonText: gettext('Cancel'),
            fields: [
                {label: gettext('Link'), name: 'href', type: 'input', initialValue: el.wlxmlNode.getAttr('href'),
                prePasteHandler: function(text) {
                                    return this.wlxmlNode.document.getLinkForUrl(text);
                                }.bind(this)
            }
            ]
        });
        e.preventDefault();
        e.stopPropagation();

        dialog.on('execute', function(event) {
            el.wlxmlNode.document.transaction(function() {
                el.wlxmlNode.setAttr('href', event.formData.href);
                event.success();
            }, {
                metadata: {
                    description: gettext('Edit link'),
                    fragment: doc.createFragment(doc.CaretFragment, {node: el.wlxmlNode.contents()[0], offset:offset})
                },
                success: function() {
                    el.canvas.select(doc.createFragment(doc.CaretFragment, {node: el.wlxmlNode.contents()[0], offset:offset}));
                }
            });
        });
        dialog.show();
    },

    deleteLink: function() {
        var el = this,
            doc = this.wlxmlNode.document;

        el.wlxmlNode.document.transaction(function() {
            var f = el.canvas.getSelection().toDocumentFragment(),
                prefLen = 0,
                ret;

            if(el.wlxmlNode.isPrecededByTextNode()) {
                prefLen = el.wlxmlNode.prev().getText().length;
            }

            ret = el.wlxmlNode.unwrapContent();
            return doc.createFragment(doc.CaretFragment, {node: ret.element1, offset: prefLen + f.offset});
        }, {
            metadata: {
                description: gettext('Remove link'),
                fragment: doc.createFragment(doc.CaretFragment, {node: el.wlxmlNode.contents()[0], offset:0})
            },
            success: function(ret) {
                el.canvas.select(ret);
            }
        });
    },

    getUrl: function(link) {
        var pattern = /^[a-z]*:\/\//g;
        if(!pattern.test(link)) {
            link = 'http://' + link;
        }
        return this.wlxmlNode.document.getUrlForLink(link);
    }
});

return linkElement;

});
