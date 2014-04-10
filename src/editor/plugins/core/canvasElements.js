define(function(require) {
    
'use strict';


var widgets = {
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
}


var comment = {
    init: function() {
        this.super.init.call(this);
        this.commentAdnotation = widgets.commentAdnotation(this.wlxmlNode);
        this.addWidget(this.commentAdnotation, 'show');
        this.commentAdnotation.DOM.show();
    },

    onMetadataChanged: function(event) {
        this.commentAdnotation.update(event.meta.node);
    },
    onMetadataAdded: function(event) {
        return this.onMetadataChanged(event);
    },
    onMetadataRemoved: function(event) {
        return this.onMetadataChanged(event);
    }
};

var footnote = {
    init: function() {
        this.super.init.call(this);
        var clickHandler = function() {
            this.toggle(true);
        }.bind(this);
        this.footnoteHandler = widgets.footnoteHandler(clickHandler);
        this.addWidget(this.footnoteHandler);

        var closeHandler = function() {
            this.toggle(false);
        }.bind(this);
        this.hideButton = widgets.hideButton(closeHandler);
        this.addWidget(this.hideButton);
        this.toggle(false, {silent: true});
    },
    toggle: function(toggle, options) {
        options = options || {};
        this.hideButton.toggle(toggle);
        this.footnoteHandler.toggle(!toggle);
        
        if(toggle) {
            this.displayAsBlock();
        } else {
            this.displayInline();
        }
        this._container().toggle(toggle);
        if(!options.silent) {
            this.trigger('elementToggled', toggle, this.documentElement);
        }
    }
}


return [
    {klass: 'comment', element: comment},
    {klass: 'footnote', element: footnote}
];


});