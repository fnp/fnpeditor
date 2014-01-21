define([
'libs/jquery',
'utils/wlxml'
], function($, wlxmlUtils) {
    
'use strict';

return {
    labelWidget: function(tag, klass) {
        return $('<span>')
            .addClass('canvas-widget canvas-widget-label')
            .text(wlxmlUtils.getTagLabel(tag) + (klass ? ' / ' + wlxmlUtils.getClassLabel(klass) : ''));
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
    },

    commentAdnotation: function(node) {
        var widget = {
            DOM: $('<div>').addClass('canvas-widget canvas-widget-comment-adnotation'),
            update: function(node) {
                var parts = [],
                    metadata = node.getMetadata(),
                    dt;
                metadata.forEach(function(row) {
                    parts.push(row.getValue());
                }, 'creator');
                metadata.some(function(row) {
                    dt = row.getValue();
                    return true; // break
                }, 'date');
                if(dt) {
                    parts.push(dt);
                }
                this.DOM.text(parts.join(', '));
            }
        };
        widget.update(node);
        return widget;
    }

};

});