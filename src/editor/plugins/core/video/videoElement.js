define(function(require) {
    
'use strict';
/* globals gettext */


var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    genericElement = require('modules/documentCanvas/canvas/genericElement'),
    Dialog = require('views/dialog/dialog'),
    boxTemplate = require('libs/text!./box.html'),
    attachments = require('views/attachments/attachments'),
    linkElement = Object.create(genericElement);

function videoParser(url) {
    var youtubeId = youtubeParser(url);
    if (youtubeId) {
        return {'videoProvider': 'youtube', 'videoId': youtubeId}
    }
    var vimeoId = vimeoParser(url);
    if (vimeoId) {
        return {'videoProvider': 'vimeo', 'videoId': vimeoId}
    }
}

function youtubeParser(url) {
    var regExp = /^.*(?:youtu.be\/|v\/|\/u\/\w\/|embed\/|\?v=|&v=|shared\?ci=)([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : false;
}

function vimeoParser(url) {
    var regExp = /https?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/;
    var match = url.match(regExp);
    return match? match[2]: false;
}

_.extend(linkElement, {
    init: function() {
        genericElement.init.call(this);
        _.bindAll(this, 'changeLink', 'deleteLink');

        var linkText = this.wlxmlNode.getAttr('src') || '',
            linkUrl = this.getUrl(linkText);
        
        this.refreshLink(linkUrl);

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
        if(event.meta.attr === 'src') {
            var link = this.box.find('[link]');
            link.text(event.meta.newVal);
            var linkUrl = this.getUrl(event.meta.newVal);
            link.attr('href', linkUrl);
            this.refreshLink(linkUrl);
        }
    },

    refreshLink: function(linkUrl) {
        this._container().find('iframe').remove();
        var videoData = videoParser(linkUrl);
        var videoFrame;
        if (videoData) {
            if (videoData.videoProvider === 'youtube') {
                videoFrame = '<iframe width="480" height="270" src="//www.youtube.com/embed/' + videoData.videoId +
                    '?controls=2&amp;rel=0&amp;showinfo=0&amp;theme=light" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
            } else if (videoData.videoProvider === 'vimeo') {
                videoFrame = '<iframe src="//player.vimeo.com/video/' + videoData.videoId +
                    '" width="480" height="270" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
            }
            this._container().text('');
            this._container().append($(videoFrame));
        } else {
            this._container().text(gettext('No video. Click here to add link to your video'));
        }
    },

    changeLink: function(e) {
        var el = this,
            dialog = Dialog.create({
            title: gettext('Edit video url'),
            executeButtonText: gettext('Apply'),
            cancelButtonText: gettext('Cancel'),
            fields: [
                {
                    label: gettext('YouTube or Vimeo link'),
                    name: 'src',
                    type: 'input',
                    initialValue: el.wlxmlNode.getAttr('src'),
                    prePasteHandler:
                        function(text) {
                            return this.wlxmlNode.document.getLinkForUrl(text);
                        }.bind(this)
                }
            ]
        });
        e.preventDefault();
        e.stopPropagation();

        dialog.on('execute', function(event) {
            var videoData = videoParser(event.formData.src);
            el.wlxmlNode.document.transaction(function() {
                el.wlxmlNode.setAttr('src', event.formData.src);
                el.wlxmlNode.setAttr('videoid', videoData.videoId);
                el.wlxmlNode.setAttr('provider', videoData.videoProvider);
                event.success();
            }, {
                metadata: {
                    description: gettext('Edit video url')
                    //fragment: doc.createFragment(doc.CaretFragment, {node: el.wlxmlNode.contents()[0], offset:offset})
                },
                success: function() {
                    //el.canvas.select(doc.createFragment(doc.CaretFragment, {node: el.wlxmlNode.contents()[0], offset:offset}));
                }
            });
        });
        dialog.show();
        $(".attachment-library", dialog.$el).on('click', function() {
            attachments.select(function(v) {$("input", dialog.$el).val(v);});
        });

    },

    deleteLink: function() {
        var el = this;

        el.wlxmlNode.document.transaction(function() {
            el.wlxmlNode.detach();
        }, {
            metadata: {
                description: gettext('Remove link')
            }
        });
    },

    getUrl: function(link) {
        var pattern = /^[a-z]*:\/\//g;
        if(!pattern.test(link) && !/^\//.test(link)) {
            link = 'http://' + link;
        }
        return this.wlxmlNode.document.getUrlForLink(link);
    }
});

return linkElement;

});
