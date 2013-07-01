define(['libs/jquery-1.9.1.min', 'libs/underscore-min'], function($, _) {

'use strict';


var tagSelector = '[wlxml-tag]';

var CanvasNode = function(desc) {
    if(desc instanceof $) {
        this.dom = desc;
        if(!this.dom.attr('id')) {
            this.dom.attr('id', 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);}));
        }
    } else {
        var toBlock = ['div', 'document', 'section', 'header'];
        var htmlTag = _.contains(toBlock, desc.tag) ? 'div' : 'span';
        this.dom = $('<' + htmlTag + '>');
        this.dom.attr('wlxml-tag', desc.tag);
        if(desc.klass)
            this.dom.attr('wlxml-class', desc.klass);
        if(desc.content)
            this.dom.text(desc.content);
        if(desc.meta) {
            var c = this;
            _.keys(desc.meta).forEach(function(key) {
                c.dom.attr('wlxml-meta-'+key, desc.meta[key]);
            });
        }
        this.dom.attr('id', 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);}));
    }
};

CanvasNode.prototype.getTag = function() {
    return this.dom.attr('wlxml-tag');
};

CanvasNode.prototype.getClass = function() {
    return this.dom.attr('wlxml-class');
};

CanvasNode.prototype.getId = function() {
    return this.dom.attr('id');
};

CanvasNode.prototype.getContent = function() {
    return this.dom.text();
};

CanvasNode.prototype.setContent = function(content) {
    this.dom.text(content);
};

CanvasNode.prototype.isSame = function(other) {
    return (other instanceof CanvasNode) && this.dom.get(0) === other.dom.get(0);
};

CanvasNode.prototype.children = function() {
    var list = [];
    this.dom.children(tagSelector).each(function() {
        list.push(new CanvasNode($(this)));
    });
    return $(list);
};


CanvasNode.prototype.parent = function() {
    var node = this.dom.parent(tagSelector);
    if(node.length)
        return new CanvasNode(node);
    return null;
};

CanvasNode.prototype.parents = function() {
    var list = [];
    this.dom.parents(tagSelector).each(function() {
        list.push(new CanvasNode($(this)));
    });
    return $(list);
};


CanvasNode.prototype.isOfClass = function(klass) {
    return this.getClass() && this.getClass().substr(0, klass.length) === klass;
};

CanvasNode.prototype.getMetaAttr = function(attr) {
    return this.dom.attr('wlxml-meta-'+attr);
}

CanvasNode.prototype.getMetaAttrs = function() {
    var toret = [];
    var metaAttrPrefix = 'wlxml-meta-';

    var attrs = this.dom.get(0).attributes;
    for(var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        if(attr.name.substr(0, metaAttrPrefix.length) === metaAttrPrefix) {
            toret.push({name: attr.name.substr(metaAttrPrefix.length), value: attr.value});    
        }
    }
    return toret;
}

CanvasNode.prototype.setMetaAttr = function(attr, value) {
    this.dom.attr('wlxml-meta-'+attr, value);
}

return {
    create: function(desc) {
        return new CanvasNode(desc);
    }

};
    

});