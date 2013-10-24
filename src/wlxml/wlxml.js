define([
    'smartxml/smartxml'
], function(smartxml) {
    
'use strict';

// utils

var isMetaAttribute = function(attrName) {
    return attrName.substr(0, 5) === 'meta-';
};

//

var WLXMLElementNode = function(nativeNode, document) {
    smartxml.ElementNode.call(this, nativeNode, document);
};
WLXMLElementNode.prototype = Object.create(smartxml.ElementNode.prototype);

$.extend(WLXMLElementNode.prototype, smartxml.ElementNode.prototype, {
    getClass: function() {
        return this.getAttr('class');
    },
    setClass: function(klass) {
        return this.setAttr('class', klass);
    },
    getMetaAttributes: function() {
        var toret = [];
        this.getAttrs().forEach(function(attr) {
            if(isMetaAttribute(attr.name)) {
                toret.push({name: attr.name.substr(5), value: attr.value});
            }
        });
        return toret;
    },
    getOtherAttributes: function() {
        var toret = {};
        this.getAttrs().forEach(function(attr) {
            if(attr.name !== 'class' && !isMetaAttribute(attr.name)) {
                toret[attr.name] = attr.value;
            }
        });
        return toret;
    },

    _getXMLDOMToDump: function() {
        var DOM = this._$.clone(true, true);

        DOM.find('*').addBack().each(function() {
            var el = $(this),
                parent = el.parent(),
                contents = parent.contents(),
                idx = contents.index(el),
                data = el.data();


            var txt;

            if(data[formatter_prefix+ 'orig_before']) {
                txt = idx > 0 && contents[idx-1].nodeType === Node.TEXT_NODE ? contents[idx-1] : null;
                if(txt && txt.data === data[formatter_prefix + 'orig_before_transformed']) {
                    txt.data = data[formatter_prefix+ 'orig_before_original'];
                } else {
                    el.before(data[formatter_prefix+ 'orig_before']);
                }
            }
            if(data[formatter_prefix+ 'orig_after']) {
                txt = idx < contents.length-1 && contents[idx+1].nodeType === Node.TEXT_NODE ? contents[idx+1] : null;
                if(txt && txt.data === data[formatter_prefix + 'orig_after_transformed']) {
                    txt.data = data[formatter_prefix+ 'orig_after_original'];
                } else {
                    el.after(data[formatter_prefix+ 'orig_after']);
                }
            }
            if(data[formatter_prefix+ 'orig_begin']) {
                el.prepend(data[formatter_prefix+ 'orig_begin']);
            }
            if(data[formatter_prefix+ 'orig_end']) {
                contents = el.contents();
                txt = (contents.length && contents[contents.length-1].nodeType === Node.TEXT_NODE) ? contents[contents.length-1] : null;
                if(txt && txt.data === data[formatter_prefix + 'orig_end_transformed']) {
                    txt.data = data[formatter_prefix+ 'orig_end_original'];
                } else {
                    el.append(data[formatter_prefix+ 'orig_end']);
                }
            }
        });

        return DOM;
    }
});





var WLXMLDocument = function(xml) {
    smartxml.Document.call(this, xml);
};

var formatter_prefix = '_wlxml_formatter_';

WLXMLDocument.prototype = Object.create(smartxml.Document.prototype);
$.extend(WLXMLDocument.prototype, {
    ElementNodeFactory: WLXMLElementNode,

    loadXML: function(xml) {
        smartxml.Document.prototype.loadXML.call(this, xml);
        $(this.dom).find(':not(iframe)').addBack().contents()
            .filter(function() {return this.nodeType === Node.TEXT_NODE;})
            .each(function() {
                var el = $(this),
                    text = {original: el.text(), trimmed: $.trim(el.text())},
                    elParent = el.parent(),
                    hasSpanParent = elParent.prop('tagName') === 'SPAN',
                    hasSpanBefore = el.prev().length && $(el.prev()).prop('tagName') === 'SPAN',
                    hasSpanAfter = el.next().length && $(el.next()).prop('tagName') === 'SPAN';


                var addInfo = function(toAdd, where, transformed, original) {
                    var parentContents = elParent.contents(),
                        idx = parentContents.index(el[0]),
                        prev = idx > 0 ? parentContents[idx-1] : null,
                        next = idx < parentContents.length - 1 ? parentContents[idx+1] : null,
                        target, key;

                    if(where === 'above') {
                        target = prev ? $(prev) : elParent;
                        key = prev ? 'orig_after' : 'orig_begin';
                    } else if(where === 'below') {
                        target = next ? $(next) : elParent;
                        key = next ? 'orig_before' : 'orig_end';
                    } else { throw new Error();}

                    target.data(formatter_prefix + key, toAdd);
                    if(transformed !== undefined) {
                        target.data(formatter_prefix + key + '_transformed', transformed);
                    }
                    if(original !== undefined) {
                        target.data(formatter_prefix + key + '_original', original);
                    }
                };

                text.transformed = text.trimmed;

                if(hasSpanParent || hasSpanBefore || hasSpanAfter) {
                    var startSpace = /\s/g.test(text.original.substr(0,1)),
                        endSpace = /\s/g.test(text.original.substr(-1)) && text.original.length > 1;
                    text.transformed = (startSpace && (hasSpanParent || hasSpanBefore) ? ' ' : '');
                    text.transformed += text.trimmed;
                    text.transformed += (endSpace && (hasSpanParent || hasSpanAfter) ? ' ' : '');
                } else {
                    if(text.trimmed.length === 0 && text.original.length > 0 && elParent.contents().length === 1) {
                        text.transformed = ' ';
                    }
                }

                if(!text.transformed) {
                    addInfo(text.original, 'below');
                    el.remove();
                    return true; // continue
                }

                if(text.transformed !== text.original) {
                    // if(!text.trimmed) {
                    //     addInfo(text.original, 'below');
                    // } else {
                        var startingMatch = text.original.match(/^\s+/g),
                            endingMatch = text.original.match(/\s+$/g),
                            startingWhiteSpace = startingMatch ? startingMatch[0] : null,
                            endingWhiteSpace = endingMatch ? endingMatch[0] : null;

                        if(endingWhiteSpace) {
                            if(text.transformed[text.transformed.length - 1] === ' ' && endingWhiteSpace[0] === ' ') {
                                endingWhiteSpace = endingWhiteSpace.substr(1);
                            }
                            addInfo(endingWhiteSpace, 'below', !text.trimmed ? text.transformed : undefined, !text.trimmed ? text.original : undefined);
                        }

                        if(startingWhiteSpace && text.trimmed) {
                            if(text.transformed[0] === ' ' && startingWhiteSpace[startingWhiteSpace.length-1] === ' ') {
                                startingWhiteSpace = startingWhiteSpace.substr(0, startingWhiteSpace.length -1);
                            }
                            addInfo(startingWhiteSpace, 'above', !text.trimmed ? text.transformed : undefined, !text.trimmed ? text.original : undefined);
                        }
                    //}
                }

                el.replaceWith(document.createTextNode(text.transformed));
            });
        this.trigger('contentSet');
    }

});


return {
    WLXMLDocumentFromXML: function(xml) {
        return new WLXMLDocument(xml);
    },

    WLXMLElementNodeFromXML: function(xml) {
        return this.WLXMLDocumentFromXML(xml).root;
    }
};

});