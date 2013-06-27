define(['libs/jquery-1.9.1.min'], function($) {

'use strict';

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
        this.dom.attr('id', 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);}));
    }
};

CanvasNode.prototype.getTag = function() {
    return this.dom.attr('wlxml-tag');
}

CanvasNode.prototype.getClass = function() {
    return this.dom.attr('wlxml-class');
}

CanvasNode.prototype.getId = function() {
    return this.dom.attr('id');
}

CanvasNode.prototype.getContent = function() {
    return this.dom.text();
}

CanvasNode.prototype.setContent = function(content) {
    this.dom.text(content);
}

CanvasNode.prototype.isSame = function(other) {
    return this.dom.get(0).isSameNode(other.dom.get(0));
}

return {
    create: function(desc) {
        return new CanvasNode(desc);
    }

}
    

});