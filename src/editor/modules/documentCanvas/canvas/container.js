define(function(require) {
    
'use strict';

var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    utils = require('./utils');


var Container = function(nodes, params, element) {
    params = params || {};
    _.extend(this, params);
    this.dom = this.dom || $('<div>');
    this.dom.addClass('canvas-container');
    this.dom.toggleClass('reset-background', !!params.resetBackground);
    this.element = element;

    nodes.forEach(function(node) {
        var el = this.element.createElement(node);
        if(el.dom) {
            this.dom.append(el.dom);
        }
    }.bind(this));
};

_.extend(Container.prototype, {
    remove: function() {
        this.element.removeContainer(this);
    },

    onNodeAdded: function(event) {
        if(event.meta.node.isRoot()) {
            this.element.canvas.reloadRoot();//
            return;
        }

        var ptr = event.meta.node.prev(),
            referenceElement, referenceAction, actionArg;
            
        while(ptr && !(referenceElement = utils.getElementForElementRootNode(ptr))) {
            ptr = ptr.prev();
        }

        if(referenceElement) {
            referenceAction = 'after';
        } else {
            referenceElement = this;
            referenceAction = '_prepend';
        }
      
        if(event.meta.move) {
            /* Let's check if this node had its own canvas element and it's accessible. */
            actionArg = utils.getElementForElementRootNode(event.meta.node);
        }
        if(!actionArg) {
            actionArg = event.meta.node;
        }

        referenceElement[referenceAction](actionArg);
    },
    onNodeDetached: function(event) {
        var container = this;
        this.dom.contents().each(function() {
            var childElement = container.element.canvas.getDocumentElement(this);
            if(childElement && childElement.wlxmlNode.sameNode(event.meta.node)) {
                childElement.detach();
                return false;
            }
        });
    },
    getVerticallyFirstTextElement: function(params) {
        var documentElement = require('./documentElement'),
            toret;
        
        params = _.extend({
            considerChildren: true
        }, params);
        
        this.children().some(function(child) {
            if(child instanceof documentElement.DocumentTextElement) {
                toret = child;
                return true; // break
            } else if(params.considerChildren) {
                toret = child.getVerticallyFirstTextElement();
                if(toret) {
                    return true; // break
                }
            }
        });
        return toret;
    },
    getFirst: function(e1, e2) {
        var idx1 = this._childIndex(e1),
            idx2 = this._childIndex(e2);
        if(e1 === null || e2 === null) {
            return undefined;
        }
        return idx1 <= idx2 ? e1: e2;
    },

    _prepend: function(param) {
        var documentElement = require('./documentElement'),
            element;
        if(param instanceof documentElement.DocumentElement) {
            element = param;
        } else {
            element = this.element.createElement(param);//
        }
        if(element.dom) {
            this.dom.prepend(element.dom);
        }
        return element;
    },
    _childIndex: function(child) {
        var children = this.children(),
            toret = null;
        children.forEach(function(c, idx) {
            if(c.sameNode(child)) {
                toret = idx;
                return false;
            }
        });
        return toret;
    },
    containsBlock: function() {
        var documentElement = require('./documentElement');
        return this.children()
            .filter(function(child) {
                return child instanceof documentElement.DocumentNodeElement;
            })
            .some(function(child) {
                if(child.isBlock()) {
                    return true;
                } else {
                    return child.containsBlock();
                }
            });
    },
    children: function() {
        var element = this.element.canvas,
            toret = [];
        this.dom.contents().each(function() {
            var childElement = element.getDocumentElement(this);
            if(childElement === undefined) {
                return true;
            }

            toret.push(childElement);
        });
        return toret;
    },
});

return {
    create: function(nodes, params, element) {
        return new Container(nodes, params, element);
    }
};

});