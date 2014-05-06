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

        var linkText = this.wlxmlNode.getAttr('href'),
            linkUrl = this.getUrl(linkText);

        this.box = $(_.template(boxTemplate)({text: linkText, url: linkUrl}));
        this.box.find('.change').on('click', this.changeLink);
        this.box.find('.delete').on('click', this.deleteLink);
        this.box.hide();
        this.addWidget(this.box);
    },
    markAsCurrent: function(toggle) {
        this.box.toggle(toggle);
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
            dialog = Dialog.create({
            title: gettext('Edit link'),
            executeButtonText: gettext('Apply'),
            cancelButtonText: gettext('Cancel'),
            fields: [
                {label: gettext('Link'), name: 'href', type: 'input', initialValue: el.wlxmlNode.getAttr('href')}
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
                    description: gettext('Edit link')
                }
            });
        });
        dialog.show();
    },

    deleteLink: function() {
        var el = this;
        el.wlxmlNode.document.transaction(function() {
            el.wlxmlNode.unwrapContent();
        }, {
            metadata: {
                description: gettext('Remove link')
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
