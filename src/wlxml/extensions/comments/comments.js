define(function() {
    
'use strict';

var extension = {wlxmlClass: {comment: {
    methods: {
        describesParent: true,
        getText: function() {
            var text = '';
            this.contents()
                .filter(function(node) {
                    /* globals Node */
                    return node && node.nodeType === Node.TEXT_NODE;
                })
                .forEach(function(node) {
                    text = text + node.getText();
                });
            return text;
        },
        setText: function(text) {
            var contents = this.contents();
            if(contents.length === 1 && contents[0].nodeType === Node.TEXT_NODE) {
                contents[0].setText(text);
            } else {
                contents.forEach(function(node) {
                    node.detach();
                });
                this.append({text: text});
            }
        }
    }
}}};

return extension;

});