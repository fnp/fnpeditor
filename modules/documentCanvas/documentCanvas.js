// Module that implements main WYSIWIG edit area

define([
'libs/underscore-min',
'./transformations', 
'./wlxmlNode',
'libs/text!./template.html'], function(_, transformations, wlxmlNode, template) {



return function(sandbox) {

    var view = {
        node: $(_.template(template)()),
        currentNode: null,
        setup: function() {
            var view = this;

            this.node.find('#rng-module-documentCanvas-content').on('keyup', function() {
                //isDirty = true;
                sandbox.publish('contentChanged');
            });

            this.node.on('mouseover', '[wlxml-tag]', function(e) {
                e.stopPropagation();
                sandbox.publish('nodeHovered', new wlxmlNode.Node($(e.target)));
            });
            this.node.on('mouseout', '[wlxml-tag]', function(e) {
                e.stopPropagation();
                sandbox.publish('nodeBlured', new wlxmlNode.Node($(e.target)));
            });
            this.node.on('click', '[wlxml-tag]', function(e) {
                e.stopPropagation();
                console.log('clicked node type: '+e.target.nodeType);
                view.selectNode(new wlxmlNode.Node($(e.target)));
            });

            this.node.on('keyup', '#rng-module-documentCanvas-contentWrapper', function(e) {
                var anchor = $(window.getSelection().anchorNode);
                if(anchor[0].nodeType === Node.TEXT_NODE)
                    anchor = anchor.parent();
                if(!anchor.is('[wlxml-tag]'))
                    return;
                view.selectNode(new wlxmlNode.Node(anchor));
            });
            
            this.node.on('keydown', '#rng-module-documentCanvas-contentWrapper', function(e) {
                if(e.which === 13) { 
                    e.preventDefault();
                    view.insertNewNode(null, null);
                }
            });
            
            
            var observer = new MutationObserver(function(mutations) {
              mutations.forEach(function(mutation) {
                _.each(mutation.addedNodes, function(node) {
                    node = $(node);
                    node.parent().find('[wlxml-tag]').each(function() {
                        tag = $(this);
                        if(!tag.attr('id'))
                            tag.attr('id', 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);}));
                    });
                });
              });    
            });
            var config = { attributes: true, childList: true, characterData: true, subtree: true };
            observer.observe(this.node.find('#rng-module-documentCanvas-contentWrapper')[0], config);
            
            this.gridToggled = false;
        },
        _createNode: function(wlxmlTag, wlxmlClass) {
            var toBlock = ['div', 'document', 'section', 'header'];
            var htmlTag = _.contains(toBlock, wlxmlTag) ? 'div' : 'span';
            var toret = $('<' + htmlTag + '>');
            toret.attr('wlxml-tag', wlxmlTag);
            if(wlxmlClass)
                toret.attr('wlxml-class', wlxmlClass);
            return toret;
        },
        insertNewNode: function(wlxmlTag, wlxmlClass) {
            //TODO: Insert inline
            var anchor = $(window.getSelection().anchorNode);
            var anchorOffset = window.getSelection().anchorOffset;
            if(anchor[0].nodeType === Node.TEXT_NODE)
                anchor = anchor.parent();
            if(anchor.text() === '') {
                var todel = anchor;
                anchor = anchor.parent();
                todel.remove();
            }
            if(anchorOffset > 0 && anchorOffset < anchor.text().length) {
                if(wlxmlTag === null && wlxmlClass === null) {
                    return this.splitWithNewNode(anchor);
                }
                return this.wrapSelectionWithNewNode(wlxmlTag, wlxmlClass);
            }
            var newNode = this._createNode(wlxmlTag || anchor.attr('wlxml-tag'), wlxmlClass || anchor.attr('wlxml-class'));
            if(anchorOffset === 0)
                anchor.before(newNode)
            else
                anchor.after(newNode);
            this.selectNode(newNode);
            //isDirty = true;
            sandbox.publish('contentChanged');
        },
        wrapSelectionWithNewNode: function(wlxmlTag, wlxmlClass) {
            var selection = window.getSelection();
            if(selection.anchorNode === selection.focusNode && selection.anchorNode.nodeType === Node.TEXT_NODE) {
                var startOffset = selection.anchorOffset;
                var endOffset = selection.focusOffset;
                if(startOffset > endOffset) {
                    var tmp = startOffset;
                    startOffset = endOffset;
                    endOffset = tmp;
                }
                var node = selection.anchorNode;
                var prefix = node.data.substr(0, startOffset);
                var suffix = node.data.substr(endOffset);
                var core = node.data.substr(startOffset, endOffset - startOffset);
                var newNode = this._createNode(wlxmlTag, wlxmlClass);
                newNode.text(core || 'test');
                $(node).replaceWith(newNode);
                newNode.before(prefix);
                newNode.after(suffix);
                
                this.selectNode(newNode);
                //isDirty = true;
                sandbox.publish('contentChanged');
            }
        },
        splitWithNewNode: function(node) {
            var selection = window.getSelection();
            if(selection.anchorNode === selection.focusNode && selection.anchorNode.nodeType === Node.TEXT_NODE) {
                var startOffset = selection.anchorOffset;
                var endOffset = selection.focusOffset;
                if(startOffset > endOffset) {
                    var tmp = startOffset;
                    startOffset = endOffset;
                    endOffset = tmp;
                }
                var anchor = selection.anchorNode;
                var prefix = anchor.data.substr(0, startOffset);
                var suffix = anchor.data.substr(endOffset);
                var prefixNode = this._createNode(node.attr('wlxml-tag'), node.attr('wlxml-class'));
                var newNode = this._createNode(node.attr('wlxml-tag'), node.attr('wlxml-class'));
                var suffixNode = this._createNode(node.attr('wlxml-tag'), node.attr('wlxml-class'));
                prefixNode.text(prefix);
                suffixNode.text(suffix);
                node.replaceWith(newNode);
                newNode.before(prefixNode);
                newNode.after(suffixNode);
                
                this.selectNode(newNode);
                //isDirty = true;
                sandbox.publish('contentChanged');
            }
        },
        setBody: function(HTMLTree) {
            this.node.find('#rng-module-documentCanvas-content').html(HTMLTree);
        },
        getBody: function() {
            return this.node.find('#rng-module-documentCanvas-content').html();
        }, 
        selectNode: function(wlxmlNode, options) {
            options = options || {};
            var nodeElement = this.getNodeElement(wlxmlNode)
            
            this.dimNode(wlxmlNode);
            
            this.node.find('.rng-module-documentCanvas-currentNode').removeClass('rng-module-documentCanvas-currentNode');
            nodeElement.addClass('rng-module-documentCanvas-currentNode');
             
            if(options.moveCarret) {
                var range = document.createRange();
                range.selectNodeContents(nodeElement[0]);
                range.collapse(false);
                var selection = document.getSelection();
                selection.removeAllRanges()
                selection.addRange(range);
            }
            
            this.currentNode = wlxmlNode;
            sandbox.publish('nodeSelected', wlxmlNode);
        },
        highlightNode: function(wlxmlNode) {
            var nodeElement = this.getNodeElement(wlxmlNode);
            if(!this.gridToggled) {
                nodeElement.addClass('rng-common-hoveredNode');
                var label = nodeElement.attr('wlxml-tag');
                if(nodeElement.attr('wlxml-class'))
                    label += ' / ' + nodeElement.attr('wlxml-class');
                var tag = $('<div>').addClass('rng-module-documentCanvas-hoveredNodeTag').text(label);
                nodeElement.append(tag);
            }
        },
        dimNode: function(wlxmlNode) {
            var nodeElement = this.getNodeElement(wlxmlNode);
            if(!this.gridToggled) {
                nodeElement.removeClass('rng-common-hoveredNode');
                nodeElement.find('.rng-module-documentCanvas-hoveredNodeTag').remove();
            }
        },
        selectFirstNode: function() {
            var firstNodeWithText = this.node.find('[wlxml-tag]').filter(function() {
                return $(this).clone().children().remove().end().text().trim() !== '';
            }).first();
            var node;
            if(firstNodeWithText.length)
                node = $(firstNodeWithText[0])
            else {
                node = this.node.find('[wlxml-class|="p"]')
            }
            this.selectNode(new wlxmlNode.Node(node));
        },
        toggleGrid: function(toggle) {
            this.node.find('[wlxml-tag]').toggleClass('rng-common-hoveredNode', toggle);
            this.gridToggled = toggle;
        },
        getNodeElement: function(wlxmlNode) {
            return this.node.find('#'+wlxmlNode.id);
        }
    };
    
    view.setup();

    /* public api */
    return {
        start: function() { sandbox.publish('ready'); },
        getView: function() { return view.node; },
        setDocument: function(xml) {
            var transformed = transformations.fromXML.getDocumentDescription(xml);
            view.setBody(transformed.HTMLTree);
            view.selectFirstNode();
            //isDirty = false;
        },
        modifyCurrentNode: function(attr, value) {
            if(view.currentNode)
                view.currentNode.attr('wlxml-'+attr, value);
        },
        highlightNode: function(wlxmlNode) {
            view.highlightNode(wlxmlNode);
        },
        dimNode: function(wlxmlNode) {
            view.dimNode(wlxmlNode);
        },
        selectNode: function(wlxmlNode) {
            view.selectNode(wlxmlNode, {moveCarret: true});
        },
        toggleGrid: function(toggle) {
            view.toggleGrid(toggle);
        },
        insertNewNode: function(wlxmlTag, wlxmlClass) {
            view.insertNewNode(wlxmlTag, wlxmlClass);
        },
        wrapSelectionWithNewNode: function(wlxmlTag, wlxmlClass) {
            view.wrapSelectionWithNewNode(wlxmlTag, wlxmlClass);
        }
    }
    
};

});