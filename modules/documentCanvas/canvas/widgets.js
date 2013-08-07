define([
'libs/jquery-1.9.1.min',
'utils/wlxml'
], function($, wlxmlUtils) {
    
'use strict';

return {
    labelWidget: function(tag, klass) {
        return $('<span>')
            .addClass('canvas-widget canvas-widget-label')
            .text(wlxmlUtils.wlxmlTagNames[tag] + (klass ? ' / ' + wlxmlUtils.wlxmlClassNames[klass] : ''));
    },

    footnoteHandler: function(clickHandler) {
        var mydom = $('<span>')
            .addClass('canvas-widget canvas-widget-footnote-handle')
            .css('display', 'inline')
            .show();

        mydom.click(function(e) {
            e.stopPropagation();
            clickHandler();
        });

        return mydom;
    },

    hideButton: function(clickHandler) {
        var mydom = $('<span>x</span>')
            .addClass('canvas-widget canvas-widget-hide-button');
        mydom.click(function(e) {
            e.stopPropagation();
            clickHandler();
        });
        return mydom;
    }

};

});