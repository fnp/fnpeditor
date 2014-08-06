define(function(require) {
    
'use strict';

/* globals gettext */

var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    documentElement = require('modules/documentCanvas/canvas/documentElement'),
    Dialog = require('views/dialog/dialog');

    
var choiceBase = Object.create(documentElement.DocumentNodeElement.prototype);
_.extend(choiceBase, {
    init: function() {
        var el = this;
        documentElement.DocumentNodeElement.prototype.init.call(this);
        this.x = $('<div class="edumed-exercise-remove btn btn-mini btn-danger">x</div>');
        this.x.on('click', function() {
            var dialog = Dialog.create({
                title: gettext('Removing exercise'),
                text: gettext('Do you really want to remove this exercise?'),
                executeButtonText: gettext('Yes'),
                cancelButtonText: gettext('No, don\'t do anything!')
            });
            dialog.on('execute', function(event) {
                el.canvas.wlxmlDocument.transaction(function() {
                    el.wlxmlNode.detach();
                }, {
                    metadata: {
                        description: gettext('Removing exercise')
                    },
                    success: function() {
                        event.success();
                    }
                });
            });
            dialog.show();

        });

        this.addWidget(this.x);
    },
});

return choiceBase;

});