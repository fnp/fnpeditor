define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'modules/documentCanvas/transformations',
'modules/documentCanvas/canvasNode',
'libs/text!./template.html'
], function($, _, transformations, canvasNode, template) {

'use strict';

var Canvas = function(html) {
    this.dom = $(template);
    this.content = this.dom.find('#rng-module-documentCanvas-content');
    this.setHTML(html);
};

Canvas.prototype.setHTML = function(html) {
    if(html) {
        this.content.html(html);
    }
};

Canvas.prototype.getContent = function() {
    return this.content.contents();
};

Canvas.prototype.findNodes = function(desc) {
    var selector = '';
    if(typeof desc === 'string') {
        selector = desc;
    }
    else {
        if(desc.klass)
            selector += '[wlxml-class=' + desc.klass + ']';
        if(desc.tag)
            selector += '[wlxml-tag=' + desc.tag + ']';
    }
    var toret = [];
    this.content.find(selector).each(function() {
        toret.push(canvasNode.create($(this)));
    });
    return toret;
};

Canvas.prototype.getNodeById = function(id) {
    return canvasNode.create($(this.content.find('#' +id)));
};

Canvas.prototype.nodeAppend = function(options) {
    var element; // = $(this.content.find('#' + options.context.id).get(0));
    if(options.to === 'root') {
        element = this.content;
    } else {
        element = $(this.content.find('#' + options.to.getId()).get(0));
    }
    element.append(options.node.dom);
};

Canvas.prototype.nodeInsertAfter = function(options) {
    var element = $(this.content.find('#' + options.after.getId()).get(0));
    element.after(options.node.dom);
};

Canvas.prototype.nodeWrap = function(options) {
    options = _.extend({textNodeIdx: 0}, options);
    if(typeof options.textNodeIdx === 'number')
        options.textNodeIdx = [options.textNodeIdx];
    
    var container = $(this.content.find('#' + options.inside.getId()).get(0)),
        containerContent = container.contents(),
        idx1 = Math.min.apply(Math, options.textNodeIdx),
        idx2 = Math.max.apply(Math, options.textNodeIdx),
        textNode1 = $(containerContent.get(idx1)),
        textNode2 = $(containerContent.get(idx2)),
        sameNode = textNode1.get(0) === textNode2.get(0),
        prefixOutside = textNode1.text().substr(0, options.offsetStart),
        prefixInside = textNode1.text().substr(options.offsetStart),
        suffixInside = textNode2.text().substr(0, options.offsetEnd),
        suffixOutside = textNode2.text().substr(options.offsetEnd)
    ;
    
    textNode1.after(options._with.dom);
    textNode1.detach();
    
    options._with.dom.before(prefixOutside);
    if(sameNode) {
        var core = textNode1.text().substr(options.offsetStart, options.offsetEnd - options.offsetStart);
        options._with.setContent(core);
    } else {
        textNode2.detach();
        options._with.dom.append(prefixInside);
        for(var i = idx1 + 1; i < idx2; i++) {
            options._with.dom.append(containerContent[i]);
        }
        options._with.dom.append(suffixInside);
    }
    options._with.dom.after(suffixOutside);
};

Canvas.prototype.nodeSplit = function(options) {
    options = _.extend({textNodeIdx: 0}, options);
    
    var nodeToSplit = $(this.content.find('#' + options.node.getId()).get(0));
    
    var nodeContents = nodeToSplit.contents();
    if(nodeContents.length === 0 || 
       nodeContents.length - 1 < options.textNodeIdx || 
       nodeContents.get(options.textNodeIdx).nodeType != 3)
        return false;
    
    var textNode = $(nodeContents.get(options.textNodeIdx));

    var succeedingNodes = [];
    var passed = false;
    nodeContents.each(function() {
        var node = this;
        if(passed)
            succeedingNodes.push(node);
        if(node === textNode.get(0))
            passed = true;
    });
    
    var prefix = $.trim(textNode.text().substr(0, options.offset));
    var suffix = $.trim(textNode.text().substr(options.offset));
    
    textNode.before(prefix);
    textNode.remove();
    
    var newNode = canvasNode.create({tag: nodeToSplit.attr('wlxml-tag'), klass: nodeToSplit.attr('wlxml-class')});
    newNode.dom.append(suffix);
    succeedingNodes.forEach(function(node) {
        newNode.dom.append(node);
    });
    nodeToSplit.after(newNode.dom);
    return newNode;
};

Canvas.prototype.nodeRemove = function(options) {
    var toRemove = $(this.content.find('#' + options.node.getId()).get(0));
    toRemove.remove();
};

Canvas.prototype.listCreate = function(options) {
    var element1 = $(this.content.find('#' + options.start.getId()).get(0));
    var element2 = $(this.content.find('#' + options.end.getId()).get(0));
    if(element1.parent().get(0) !== element2.parent().get(0))
        return false;
        
    var parent = element1.parent();
    
    if(parent.contents().index(element1) > parent.contents().index(element2)) {
        var tmp = element1;
        element1 = element2;
        element2 = tmp;
    }
    
    var nodesToWrap = [];
    
    var place = 'before';
    var canvas = this;
    parent.contents().each(function() {
        var node = this;
        if(node === element1.get(0))
            place = 'inside';
        if(place === 'inside') {
            var $node;
            if(node.nodeType === 3) {
                $node = canvasNode.create({tag: 'div', content: $.trim(node.data)}).dom; //canvas._createNode('div').text(node.data);
                $(node).remove();
            }
            else {
                $node = $(node);
            }
            $node.attr('wlxml-class', 'item');
            nodesToWrap.push($node);
        }
        if(node === element2.get(0))
            return false;
    });
    
    var list = canvasNode.create({tag: 'div', klass: 'list-items' + (options.type === 'enum' ? '-enum' : '')}).dom; //this._createNode('div', 'list-items');
    
    var parentNode = options.start.parent();
    
    var toret;
    if(parentNode && parentNode.isOfClass('list-items')) {
        list.wrap('<div wlxml-tag="div" wlxml-class="item" class="canvas-silent-item">');
        toret = list.parent();
    } else {
        toret = list;
    }
        
    
    element1.before(toret);
    
    nodesToWrap.forEach(function(node) {
        node.remove();
        list.append(node);
    });
};

Canvas.prototype.listRemove = function(options) {
    var pointerElement = $(this.content.find('#' + options.pointer.getId()));
    var listElement = options.pointer.getClass() === 'list-items' ? pointerElement : 
        pointerElement.parents('[wlxml-class|="list-items"][wlxml-tag]');
    
    var nested = false;
    if(listElement.length > 1) {
        listElement = $(listElement[0]);
        nested = true;
    }
    
    if(nested) {
        listElement.unwrap();
    } else {
        listElement.find('[wlxml-class=item]').each(function() {
            $(this).removeAttr('wlxml-class');
        });
    }
    listElement.children().unwrap();
};

Canvas.prototype.getPrecedingNode = function(options) {
    var element = $(this.content.find('#' + options.node.getId()).get(0));
    var prev = element.prev();
    if(prev.length === 0)
        prev = element.parent();
    return canvasNode.create(prev);
};

Canvas.prototype.nodeInsideList = function(options) {
    if(options.node) {
        if(options.node.isOfClass('list-items') || options.node.isOfClass('item'))
            return true;
        var pointerElement = $(this.content.find('#' + options.node.getId()));
        return pointerElement.parents('[wlxml-class=list-items], [wlxml-class=item]').length > 0;
    }
    return false;
};


return {
    create: function(desc) { return new Canvas(desc); }
};

});