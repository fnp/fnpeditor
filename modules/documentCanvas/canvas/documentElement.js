define([
'libs/jquery-1.9.1.min'
], function($) {
    
'use strict';

// DocumentElement represents a node from WLXML document rendered inside Canvas
var DocumentElement = function(htmlElement) {
    if(arguments.length === 0)
        return;
    this.$element = $(htmlElement);
    this.wlxmlTag = this.$element.prop('tagName');
};

$.extend(DocumentElement.prototype, {
    children: function() {
        var toret = [];
        if(this instanceof DocumentTextElement)
            return toret;


        var elementContent = this.$element.contents();
        elementContent.each(function(idx) {
            var element = documentElementFromHTMLElement(this);
            if(idx === 0 && elementContent.length > 1 && elementContent[1].nodeType === Node.ELEMENT_NODE && (element instanceof DocumentTextElement) && $.trim($(this).text()) === '')
                return true;
            if(idx > 0 && element instanceof DocumentTextElement) {
                if(toret[toret.length-1] instanceof DocumentNodeElement && $.trim($(this).text()) === '')
                    return true;
            }
            toret.push(element);
        });
        return toret;
    },
    parent: function() {
        return documentElementFromHTMLElement(this.$element.parent()[0]);
    },

    sameNode: function(other) {
        return other && (typeof other === typeof this) && other.$element[0] === this.$element[0];
    },

    wrapWithNodeElement: function(wlxmlNode) {
        this.$element.wrap($('<' + wlxmlNode.tag + ' class="' + wlxmlNode.klass + '"">')[0]);
        return documentElementFromHTMLElement(this.$element.parent().get(0));
    }
});

var DocumentNodeElement = function(htmlElement) {
    DocumentElement.call(this, htmlElement);
};

var DocumentTextElement = function(htmlElement) {
    DocumentElement.call(this, htmlElement);  
};

DocumentNodeElement.prototype = new DocumentElement();
DocumentTextElement.prototype = new DocumentElement();

$.extend(DocumentNodeElement.prototype, {
    append: function(params) {
        var to_append = DocumentNodeElement.createDOM(params.tag, params.klass)
        this.$element.append(to_append);
        return documentElementFromHTMLElement(to_append);
    },
    after: function(params) {
        var to_append = DocumentNodeElement.createDOM(params.tag, params.klass)
        this.$element.after(to_append);
        return documentElementFromHTMLElement(to_append);   
    }
})

DocumentNodeElement.createDOM = function(tag, klass) {
    var dom = $('<' + tag + '>');
    if(klass)
        dom.attr('class', klass);
    return dom;
}

var documentElementFromHTMLElement = function(htmlElement) {
    if(htmlElement.nodeType === Node.ELEMENT_NODE)
        return new DocumentNodeElement(htmlElement);
    if(htmlElement.nodeType === Node.TEXT_NODE)
        return new DocumentTextElement(htmlElement);
}

return {
    wrap: function(htmlElement) {
        return documentElementFromHTMLElement(htmlElement);
    },
    DocumentElement: DocumentElement,
    DocumentNodeElement: DocumentNodeElement,
    DocumentTextElement: DocumentTextElement
};

});