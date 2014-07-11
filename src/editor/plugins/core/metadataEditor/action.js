define(function(require) {
    
'use strict';
/* globals gettext */

var Dialog = require('views/dialog/dialog'),
    View = require('./view');


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
                        cssClass: 'metadataEditor'
                    }),
                    view = new View(params.doc.root, ctx.config);
                dialog.show();
                dialog.setContentView(view.dom);
                dialog.on('execute', function(e) {
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