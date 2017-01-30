define(function(require) {
    
'use strict';
/* globals gettext */

var Dialog = require('views/dialog/dialog'),
    View = require('plugins/core/metadataEditor/view');


return function(ctx) {
    return {
        name: 'showMetadataEditor',
        params: {
            doc: {type: 'context', name: 'document'}
        },
        stateDefaults: {
            allowed: true,
            label: gettext('Metadata'),
            execute: function(callback, params) {
                void(callback);
                var dialog = Dialog.create({
                        title: gettext('Document Metadata'),
                        executeButtonText: gettext('Close'),
                        cssClass: 'metadataEditor',
                        closeButton: false
                    }),
                    view = new View(params.doc.root, ctx.config);
                dialog.show();
                dialog.setContentView(view.dom);
                dialog.on('execute', function(e) {
                    var cover_url = view.getMetadataByKey('relation.coverimage.url');
                    if (cover_url && !cover_url.match(/\.(png|jpg|jpeg|gif|tif|tiff)$/i)) {
                        window.alert(gettext('The cover needs to be an image file: jpg, png, gif. Use another URL or clear the cover field.'));
                        return;
                    }
                    e.success();
                });
            }
        },
        getState: function(params) {
            return {
                allowed: !!params.doc
            };
        }
    };
};

});