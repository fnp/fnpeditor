define([
'libs/jquery-1.9.1.min'
], function($) {
    
'use strict';

return {
    labelWidget: function(tag, klass) {
        return $('<span>')
            .addClass('canvas-widget canvas-widget-label')
            .text(tag + (klass ? ' / ' + klass : ''));
    },

    footnoteHandler: function(clickHandler) {
        var mydom = $('<span>')
            .addClass('canvas-widget canvas-widget-footnote-handle')
            .css('display', 'inline')
            .show();

        mydom.click(function() {
            clickHandler();
        });

        return mydom;
    },

    hideButton: function(clickHandler) {
        var mydom = $('<span>x</span>')
            .addClass('canvas-widget canvas-widget-hide-button');
        mydom.click(clickHandler);
        return mydom;
    }

};

});