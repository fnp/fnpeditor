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
            if(
                (toret.length === 0 && (element instanceof DocumentNodeElement)) ||
                (toret.length > 0 && (toret[toret.length -1] instanceof DocumentNodeElement) && (element instanceof DocumentNodeElement))
            )
                toret.push(documentElementFromHTMLElement(document.createTextNode()));
            toret.push(element);
            if((idx === elementContent.length - 1) && (element instanceof DocumentNodeElement))
                toret.push(documentElementFromHTMLElement(document.createTextNode()));
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