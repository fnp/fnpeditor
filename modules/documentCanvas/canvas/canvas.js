define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'modules/documentCanvas/canvas/documentElement'
], function($, _, documentElement) {
    
'use strict';

var Canvas = function(xml) {
    xml = $.parseXML(xml);
    this.d = xml !== null ? $(xml.childNodes[0]) : null;
    if(this.d) {
        var wrapper = $('<div>');
        wrapper.append(this.d);
        wrapper.find(':not(iframe)').addBack().contents()
            .filter(function() {return this.nodeType === Node.TEXT_NODE})
            .each(function() {

                var el = $(this);
                
                // TODO: use DocumentElement API
                var spanParent = el.parent().prop('tagName') === 'span',
                    spanBefore = el.prev().length > 0  && $(el.prev()[0]).prop('tagName') === 'span',
                    spanAfter = el.next().length > 0 && $(el.next()[0]).prop('tagName') === 'span';
                    
                if(spanParent || spanBefore || spanAfter) {
                    var startSpace = /\s/g.test(this.data.substr(0,1));
                    var endSpace = /\s/g.test(this.data.substr(-1)) && this.data.length > 1;
                    var trimmed = $.trim(this.data);
                    this.data = (startSpace && (spanParent || spanBefore) ? ' ' : '')
                                + trimmed
                                + (endSpace && (spanParent || spanAfter) ? ' ' : '');

                } else {
                    this.data = $.trim(this.data);
                }
            });
        this.d.unwrap();
    };
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
        
        if(prefixOutside.length > 0)
            wrapperElement.before({text:prefixOutside});
        if(sameNode) {
            var core = textNode1.getText().substr(params.offsetStart, params.offsetEnd - params.offsetStart);
            wrapperElement.append({text: core});
        } else {
            textNode2.detach();
            if(prefixInside.length > 0)
                wrapperElement.append({text: prefixInside});
            for(var i = idx1 + 1; i < idx2; i++) {
                wrapperElement.append(childrenInside[i]);
            }
            if(suffixInside.length > 0)
                wrapperElement.append({text: suffixInside});
        }
        if(suffixOutside.length > 0)
            wrapperElement.after({text: suffixOutside});
        return wrapperElement;
    },
    list: {}
});

$.extend(Canvas.prototype.list, {
    create: function(params) {
        if(!(params.element1.parent().sameNode(params.element2.parent())))
            return false;
            
        var parent = params.element1.parent();
        
        if(parent.childIndex(params.element1) > parent.childIndex(params.element2)) {
            var tmp = params.element1;
            params.element1 = params.element2;
            params.element2 = tmp;
        }
        
        var elementsToWrap = [];
        
        var place = 'before';
        var canvas = this;
        parent.children().forEach(function(element) {
            if(element.sameNode(params.element1))
                place = 'inside';
            if(place === 'inside') {
                if(element instanceof documentElement.DocumentTextElement) {
                    element = element.wrapWithNodeElement({tag: 'div', klass: 'list.item'});
                    if(element.children()[0].sameNode(params.element1))
                        params.element1 = element;
                }
                element.setWlxmlClass('item');
                elementsToWrap.push(element);
            }
            if(element.sameNode(params.element2))
                return false;
        });
        
        var listElement = documentElement.DocumentNodeElement.create({tag: 'div', klass: 'list-items' + (params.type === 'enum' ? '-enum' : '')});
        
        var toret;
        if(parent.is('list')) {
            listElement.wrap({tag: 'div', klass: 'item'});
            toret = listElement.parent();
        } else {
            toret = listElement;
        }  
        
        params.element1.before(toret);
        
        elementsToWrap.forEach(function(element) {
            element.detach();
            listElement.append(element);
        });
    }
});

return {
    fromXML: function(xml) {
        return new Canvas(xml);
    }
};

});