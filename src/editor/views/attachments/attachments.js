define(function(require) {

    'use strict';

    var $ = require('libs/jquery'),
        Dialog = require('views/dialog/dialog');



// Move it somewhere else.
var attachmentLibrary = function(callback, params) {
    var dialog = Dialog.create({
        title: gettext('Attachment library'),
        executeButtonText: gettext('Select'),
        cancelButtonText: gettext('Cancel'),
    });

    var output = "";

    dialog.on('execute', function(event) {
        callback($(".active", dialog.$el).attr('data-output'));
        event.success();
    });

    dialog.show();
    var body = $(".modal-body", dialog.$el);
    $.ajax(config.documentGalleryUrl, {
        dataType: 'json',
        success: function(data, status, jqxhr) {
            for (var i in data) {
                var img = $("<img style='margin-right: 1em'>");
                var input = $("<input type='radio' name='attachment'>");
                var label = $("<label/>");
                var div = $("<div style='border: 1px solid white'/>");
                label.append(input);
                label.append(img);
                label.append(data[i]['name']);
                img.attr("src", data[i]['thumbnail_url']);
                img.attr("title", data[i]['name']);
                input.attr('id', 'attachment' + i);
                label.attr('for', 'attachment' + i);
                div.append(label);
                div.attr("data-output", 'file://' + data[i]['name']);
                div.on('click', function() {
                    $("div.active", body).removeClass('active');
                    $(this).addClass('active');
                });
                body.append(div);
            }
            var editlink = $("<a target='_blank'>" + gettext("Manage attachments") + "</a>");
            editlink.attr('href', config.documentGalleryUrl);
            body.append(editlink);
        },
    });
};



    return {
        select: function(callback, params) {
            return new attachmentLibrary(callback, params);
        }
    };

});