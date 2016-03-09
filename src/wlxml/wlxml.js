define([
    'libs/jquery',
    'libs/underscore',
    'smartxml/smartxml',
    'smartxml/transformations',
    'wlxml/extensions/metadata/metadata',
    'wlxml/extensions/comments/comments',
    'wlxml/extensions/edumed/edumed'
], function($, _, smartxml, transformations, metadataExtension, commentExtension, edumedExtension) {
    
'use strict';

/* globals Node */


var WLXMLDocumentNodeMethods =  {
    isInside: function(query) {
        var parent = this.getParent(query);
        return !!parent;
    },
    getParent: function(query) {
        /* globals Node */
        var me = this.nodeType === Node.ELEMENT_NODE ? [this] : [],
            toret;
        me.concat(this.parents()).some(function(node) {
            if(node.is(query)) {
                toret = node;
            }
            return !!toret || (!node.sameNode(this) && node.isContextRoot());
        }.bind(this));

        return toret;
    },
    isContextRoot: function() {
        var me = this.nodeType === Node.ELEMENT_NODE ? [this] : [],
            toret = false;
        if(!this.parent()) {
            return true;
        }
        me.concat(this.parents()).some(function(node) {
            if(_.isFunction(node.object.isContextRoot) && node.object.isContextRoot(this)) {
                toret = true;
                return true;
            }
        }.bind(this));
        return toret;
    },
    getContextRoot: function() {
        var contextRoot;
        [this].concat(this.parents()).some(function(n) {
            if(n.isContextRoot()) {
                contextRoot = n;
                return true;
            }
        });
        return contextRoot;
    },
    hasSameContextRoot: function(other) {
        return this.getContextRoot().sameNode(other.getContextRoot());
    }
};

var getClassLists = function(klassName) {
    var toret = [],
        classParts = [''].concat(klassName.split('.')),
        classCurrent;

    classParts.forEach(function(part) {
        classCurrent = classCurrent ? classCurrent + '.' + part : part;
        toret.push(classCurrent);
    });
    return toret;
};

var installObject = function(instance, klass) {
    var methods = {},
        transformations = {};

    getClassLists(klass).forEach(function(klassName) {
        _.extend(methods, instance.document.classMethods[klassName] || {});
        _.extend(methods, instance.document.classTransformations[klassName] || {});
    });
    instance.object = Object.create(_.extend({}, methods, transformations));
    _.keys(methods).concat(_.keys(transformations)).forEach(function(key) {
        if(_.isFunction(instance.object[key])) {
            instance.object[key] = _.bind(instance.object[key], instance);
        }
    });
};

var WLXMLElementNode = function(nativeNode, document) {
    smartxml.ElementNode.call(this, nativeNode, document);
    installObject(this, this.getClass());
};
WLXMLElementNode.prototype = Object.create(smartxml.ElementNode.prototype);

$.extend(WLXMLElementNode.prototype, WLXMLDocumentNodeMethods, smartxml.ElementNode.prototype, {
    getClass: function() {
        return this.getAttr('class') || '';
    },
    getClassHierarchy: function() {
        return getClassLists(this.getClass());
    },
    setClass: function(klass) {
        if(klass !== this.klass) {
            installObject(this, klass);
            return this.setAttr('class', klass);
        }
    },
    is: function(query) {
        if(typeof query === 'string') {
            query = {klass: query};
        }
        return (_.isUndefined(query.klass) || this.getClass().substr(0, query.klass.length) === query.klass) &&
               (_.isUndefined(query.tagName) || this.getTagName() === query.tagName);
    },
    hasChild: function(query) {
        return this.contents().some(function(child) {
            return child.is(query);
        }.bind(this));
    },
    find: function(query) {
        var doc = this.document;
        return this._$.find('*')
            .map(function() {
                return doc.createDocumentNode(this);
            })
            .filter(function() {
                return this.is(query);
            });
    },

    _getXMLDOMToDump: function() {
        var DOM = this._$.clone(true, true),
            doc = this.document;

        DOM.find('*').addBack().each(function() {
            var el = $(this),
                parent = el.parent(),
                contents = parent.contents(),
                idx = contents.index(el),
                data = el.data();


            var txt, documentNode, metaNode;

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


            if(this.nodeType === Node.ELEMENT_NODE) {
                documentNode = doc.createDocumentNode(this);
                metaNode = $('<metadata>');
                documentNode.getMetadata().forEach(function(row) {
                    metaNode.append('<dc:'+ row.key + '>' + row.value + '</dc:' + row.key + '>');
                });
                if(metaNode.children().length) {
                    $(this).prepend(metaNode);
                }
            }
        });

        return DOM;
    }
});


var WLXMLDocumentNode = function() {
    smartxml.DocumentNode.apply(this, arguments);
};
WLXMLDocumentNode.prototype = Object.create(smartxml.DocumentNode.prototype);

var WLXMLTextNode = function() {
    smartxml.TextNode.apply(this, arguments);
};
WLXMLTextNode.prototype = Object.create(smartxml.TextNode.prototype);
$.extend(WLXMLTextNode.prototype, WLXMLDocumentNodeMethods, {
    is: function() { return false; }
});

var WLXMLDocument = function(xml, options) {
    this.classMethods = {};
    this.classTransformations = {};
    smartxml.Document.call(this, xml, [metadataExtension, commentExtension, edumedExtension]);
    this.options = options;
};

var formatter_prefix = '_wlxml_formatter_';


WLXMLDocument.prototype = Object.create(smartxml.Document.prototype);
$.extend(WLXMLDocument.prototype, {
    ElementNodeFactory: WLXMLElementNode,
    TextNodeFactory: WLXMLTextNode,
    loadXML: function(xml) {
        smartxml.Document.prototype.loadXML.call(this, xml, {silent: true});
        this.trigger('contentSet');
    },

    normalizeXML: function(nativeNode) {
        var doc = this,
            prefixLength = 'dc:'.length;

        $(nativeNode).find('metadata').each(function() {
            var metadataNode = $(this),
                owner = doc.createDocumentNode(metadataNode.parent()[0]),
                metadata = owner.getMetadata();
                
            metadataNode.children().each(function() {
                metadata.add({key: (this.tagName).toLowerCase().substr(prefixLength), value: $(this).text()}, {undoable: false});
            });
            metadataNode.remove();
        });
        nativeNode.normalize();
        $(nativeNode).find('*').each(function() {
            if (this.childNodes.length === 0) {
                var fakeTextNode = window.document.createTextNode("");
                this.appendChild(fakeTextNode);
            }
        });

        $(nativeNode).find(':not(iframe)').addBack().contents()
            .filter(function() {return this.nodeType === Node.TEXT_NODE;})
            .each(function() {
                var el = $(this),
                    text = {original: el.text(), trimmed: $.trim(el.text())},
                    elParent = el.parent(),
                    hasSpanParent = elParent.prop('tagName') === 'SPAN',
                    hasSpanBefore = el.prev().length && $(el.prev()).prop('tagName') === 'SPAN',
                    hasSpanAfter = el.next().length && $(el.next()).prop('tagName') === 'SPAN',
                    onlyChild = el.is(':only-child');


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

                if(!text.transformed && !onlyChild) {
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
                /* globals document */
                el.replaceWith(document.createTextNode(text.transformed));
            });
        

    },

    registerClassTransformation: function(Transformation, className) {
        var thisClassTransformations = (this.classTransformations[className] = this.classTransformations[className] || {});
        thisClassTransformations[Transformation.prototype.name] = function() {
            var nodeInstance = this;
            var args = Array.prototype.slice.call(arguments, 0);
            return nodeInstance.transform(Transformation, args);
        };
    },

    registerClassMethod: function(methodName, method, className) {
        var thisClassMethods = (this.classMethods[className] = this.classMethods[className] || {});
        thisClassMethods[methodName] = method;
    },

    registerExtension: function(extension) {
        smartxml.Document.prototype.registerExtension.call(this, extension);
        var doc = this;

        _.pairs(extension.wlxmlClass).forEach(function(pair) {
            var className = pair[0],
                classExtension = pair[1];

            _.pairs(classExtension.methods || {}).forEach(function(pair) {
                var name = pair[0],
                    method = pair[1];
                doc.registerClassMethod(name, method, className);
            });

            _.pairs(classExtension.transformations || {}).forEach(function(pair) {
                var name = pair[0],
                    desc = pair[1];
                doc.registerClassTransformation(transformations.createContextTransformation(desc, name), className);
            });
        });

    }

});

return {
    WLXMLDocumentFromXML: function(xml, options, Factory) {
        Factory = Factory || WLXMLDocument;
        return new Factory(xml, options);
    },
    WLXMLElementNodeFromXML: function(xml) {
        return this.WLXMLDocumentFromXML(xml).root;
    },

    WLXMLDocument: WLXMLDocument,
    getClassHierarchy: getClassLists
};

});