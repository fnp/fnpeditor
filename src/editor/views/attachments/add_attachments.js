define(function(require) {
    'use strict';

    var $ = require('libs/jquery');

    return function (dialog) {
        var body = $(".modal-body", dialog.$el);
        var input = $("input[name=href]", body);
        $.ajax(config.documentGalleryUrl, {
            dataType: 'json',
            success: function (data, status, jqxhr) {
                for (var i in data) {
                    var img = $("<img style='margin-right: 1em'>");
                    var button = $("<button/>").attr('type', 'button').addClass('choice');
                    var div = $("<div style='border: 1px solid white'/>");
                    button.append(img);
                    button.append(data[i]['name']);
                    img.attr("src", data[i]['thumbnail_url']);
                    img.attr("title", data[i]['name']);
                    button.attr('for', 'attachment' + i);
                    div.append(button);
                    div.attr("data-output", 'file://' + data[i]['name']);
                    div.on('click', function () {
                        input.val($(this).attr('data-output'));
                    });
                    body.append(div);
                }
                var editlink = $("<a target='_blank'>" + gettext("Manage attachments") + "</a>");
                editlink.attr('href', config.documentGalleryUrl);
                body.append(editlink);
            }
        });
    };
});
