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
            if(idx === 0 && elementContent.length > 1 && elementContent[1].nodeType === Node.ELEMENT_NODE && $.trim($(this).text()) === '')
                return true;
            if(idx > 0 && element instanceof DocumentTextElement) {
                if(toret[toret.length-1] instanceof DocumentNodeElement && $.trim($(this).text()) === '')
                    return true;
            }
            toret.push(element);
        });
        return toret;
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