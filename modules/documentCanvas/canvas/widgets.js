define([
'libs/jquery-1.9.1.min'
], function($) {
    
'use strict';

return {
    labelWidget: function(tag, klass) {
        return $('<span>')
            .addClass('canvas-widget canvas-widget-label')
            .text(tag + (klass ? ' / ' + klass : ''));
    }
};

});