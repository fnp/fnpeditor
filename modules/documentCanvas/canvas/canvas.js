define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'modules/documentCanvas/canvas/documentElement'
], function($, _, documentElement) {
    
'use strict';

var Canvas = function(xml) {
    xml = $.parseXML(xml);
    this.d = xml !== null ? $(xml.childNodes[0]) : null;
};

$.extend(Canvas.prototype, {

    doc: function() {
        if(this.d === null)
            return null;
        return documentElement.wrap(this.d.get(0), this); //{wlxmlTag: this.d.prop('tagName')};
    },

    wrapText: function(params) {
        params = _.extend({textNodeIdx: 0}, params);
        if(typeof params.textNodeIdx === 'number')
            params.textNodeIdx = [params.textNodeIdx];
        
        //var container = params.inside.dom(),
        var childrenInside = params.inside.children(),
            idx1 = Math.min.apply(Math, params.textNodeIdx),
            idx2 = Math.max.apply(Math, params.textNodeIdx),
            textNode1 = childrenInside[idx1],
            textNode2 = childrenInside[idx2],
            sameNode = textNode1.sameNode(textNode2),
            prefixOutside = textNode1.getText().substr(0, params.offsetStart),
            prefixInside = textNode1.getText().substr(params.offsetStart),
            suffixInside = textNode2.getText().substr(0, params.offsetEnd),
            suffixOutside = textNode2.getText().substr(params.offsetEnd)
        ;
        
        var wrapperElement = documentElement.DocumentNodeElement.create({tag: params._with.tag, klass: params._with.klass});
        textNode1.after(wrapperElement);
        textNode1.detach();
        
        wrapperElement.before({text:prefixOutside});
        if(sameNode) {
            var core = textNode1.getText().substr(params.offsetStart, params.offsetEnd - params.offsetStart);
            wrapperElement.append({text: core});
        } else {
            textNode2.detach();
            wrapperElement.append({text: prefixInside});
            for(var i = idx1 + 1; i < idx2; i++) {
                wrapperElement.append(childrenInside[i]);
            }
            
            wrapperElement.append({text: suffixInside});
        }
        wrapperElement.after({text: suffixOutside});
        return wrapperElement;
    }

});

return {
    fromXML: function(xml) {
        return new Canvas(xml);
    }
};

});