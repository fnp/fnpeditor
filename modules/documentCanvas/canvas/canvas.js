define([
'libs/jquery-1.9.1.min',
'modules/documentCanvas/canvas/documentElement'
], function($, documentElement) {
    
'use strict';

var Canvas = function(xml) {
    xml = $.parseXML(xml);
    this.d = xml !== null ? $(xml.childNodes[0]) : null;
};

$.extend(Canvas.prototype, {

    doc: function() {
        if(this.d === null)
            return null;
        return documentElement.wrap(this.d.get(0)); //{wlxmlTag: this.d.prop('tagName')};
    }

});

return {
    fromXML: function(xml) {
        return new Canvas(xml);
    }
};

});