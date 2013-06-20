define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'modules/documentCanvas/transformations',
'modules/documentCanvas/wlxmlNode',
'libs/text!./template.html'
], function($, _, transformations, wlxmlNode, template) {

'use strict';

var Canvas = function(xml) {
    this.xml = xml;
    this.dom = $(template);
    
    this.content = this.dom.find('#rng-module-documentCanvas-content')
    
    
    this.content.html(transformations.fromXML.getHTMLTree(xml));
}

Canvas.prototype.toXML = function() {
    return transformations.toXML.getXML(this.content.html());
}

Canvas.prototype.getNode = function(desc) {
    var selector = '';
    if(desc.klass)
        selector += '[wlxml-class=' + desc.klass + ']';
    if(desc.tag)
        selector += '[wlxml-tag=' + desc.tag + ']';
    var toret = [];
    this.content.find(selector).each(function() {
        toret.push(new wlxmlNode.Node($(this)));
    });
    return toret;
}

Canvas.prototype._createNode = function(wlxmlTag, wlxmlClass) {
            var toBlock = ['div', 'document', 'section', 'header'];
            var htmlTag = _.contains(toBlock, wlxmlTag) ? 'div' : 'span';
            var toret = $('<' + htmlTag + '>');
            toret.attr('wlxml-tag', wlxmlTag);
            if(wlxmlClass)
                toret.attr('wlxml-class', wlxmlClass);
            toret.attr('id', 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);}));
            return toret;
        };

Canvas.prototype.insertNode = function(options) {
    var element = $(this.content.find('#' + options.context.id).get(0));
    if(options.place == 'after')
        element[options.place](this._createNode(options.tag, options.klass));
    else if(options.place == 'wrapText') {
        var elementContents = element.contents();
        if(elementContents.length !== 1 || elementContents.get(0).nodeType != 3)
            return false;
        var textElement = elementContents.get(0);

        var prefix = textElement.data.substr(0, options.offsetStart);
        var suffix = textElement.data.substr(options.offsetEnd);
        var core = textElement.data.substr(options.offsetStart, options.offsetEnd - options.offsetStart);
        var newNode = this._createNode(options.tag, options.klass);
        newNode.text(core);
        $(textElement).replaceWith(newNode);
        newNode.before(prefix);
        newNode.after(suffix);
    }
}

Canvas.prototype.splitNode = function(options) {
    var element = $(this.content.find('#' + options.node.id).get(0));
    
    var elementContents = element.contents();
    if(elementContents.length !== 1 || elementContents.get(0).nodeType != 3)
        return false;
    var textElement = elementContents.get(0);
    
    var prefix = textElement.data.substr(0, options.offset);
    var suffix = textElement.data.substr(options.offset);
    var prefixNode = this._createNode(element.attr('wlxml-tag'), element.attr('wlxml-class'));
    var suffixNode = this._createNode(element.attr('wlxml-tag'), element.attr('wlxml-class'));
    prefixNode.text(prefix);
    suffixNode.text(suffix);
    element.before(prefixNode);
    element.after(suffixNode);
    element.remove();
}

Canvas.prototype.createList = function(options) {
    var element1 = $(this.content.find('#' + options.start.id).get(0));
    var element2 = $(this.content.find('#' + options.end.id).get(0));
    if(!element1.parent().get(0).isSameNode(element2.parent().get(0)))
        return false;
        
    var parent = element1.parent();
    var nodesToWrap = [];
    
    var place = 'before';
    var canvas = this;
    parent.contents().each(function() {
        var node = this;
        if(node.isSameNode(element1.get(0)))
            place = 'inside';
        if(place === 'inside') {
            var $node;
            if(node.nodeType === 3) {
                $node = canvas._createNode('div').text(node.data);
                $(node).remove();
            }
            else {
                $node = $(node);
            }
            $node.attr('wlxml-class', 'list.item');
            nodesToWrap.push($node);
        }
        if(node.isSameNode(element2.get(0)))
            return;
    });
    
    var list = this._createNode('div', 'list');
    element1.before(list);
    
    nodesToWrap.forEach(function(node) {
        node.remove();
        list.append(node);
    });
    
    
    
}


return {Canvas: Canvas, Node: Node};

});