// Module that implements main WYSIWIG edit area

define([
'libs/underscore-min',
'./transformations', 
'libs/text!./template.html'], function(_, transformations, template) {



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

            this.node.on('mouseover', '[wlxml-tag]', function(e) { sandbox.publish('nodeHovered', $(e.target)); });
            this.node.on('mouseout', '[wlxml-tag]', function(e) { sandbox.publish('nodeBlured', $(e.target)); });
            this.node.on('click', '[wlxml-tag]', function(e) {
                console.log('clicked node type: '+e.target.nodeType);
                view._markSelected($(e.target));
            });

            this.node.on('keyup', '#rng-module-documentCanvas-contentWrapper', function(e) {
                var anchor = $(window.getSelection().anchorNode);
                if(anchor[0].nodeType === Node.TEXT_NODE)
                    anchor = anchor.parent();
                if(!anchor.is('[wlxml-tag]'))
                    return;
                view._markSelected(anchor);
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
        _markSelected: function(node) {
            this.dimNode(node);
            
            this.node.find('.rng-module-documentCanvas-currentNode').removeClass('rng-module-documentCanvas-currentNode');
            
            node.addClass('rng-module-documentCanvas-currentNode');

            this.currentNode = node;
            sandbox.publish('nodeSelected', node);
            
        },
        selectNode: function(node) {
            view._markSelected(node);
            var range = document.createRange();
            range.selectNodeContents(node[0]);
            range.collapse(false);

            var selection = document.getSelection();
            selection.removeAllRanges()
            selection.addRange(range);
        },
        selectNodeById: function(id) {
            var node = this.node.find('#'+id);
            if(node)
                this.selectNode(node);
        },
        highlightNode: function(node) {
            if(!this.gridToggled) {
                node.addClass('rng-common-hoveredNode');
                var label = node.attr('wlxml-tag');
                if(node.attr('wlxml-class'))
                    label += ' / ' + node.attr('wlxml-class');
                var tag = $('<div>').addClass('rng-module-documentCanvas-hoveredNodeTag').text(label);
                node.append(tag);
            }
        },
        dimNode: function(node) {
            if(!this.gridToggled) {
                node.removeClass('rng-common-hoveredNode');
                node.find('.rng-module-documentCanvas-hoveredNodeTag').remove();
            }
        },
        highlightNodeById: function(id) {
            var node = this.node.find('#'+id);
            if(node)
                this.highlightNode(node);
        },
        dimNodeById: function(id) {
            var node = this.node.find('#'+id);
            if(node)
                this.dimNode(node);
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
            this.selectNode(node);
        },
        toggleGrid: function(toggle) {
            this.node.find('[wlxml-tag]').toggleClass('rng-common-hoveredNode', toggle);
            this.gridToggled = toggle;
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
        highlightNode: function(id) {
            view.highlightNodeById(id);
        },
        dimNode: function(id) {
            view.dimNodeById(id);
        },
        selectNode: function(id) {
            view.selectNodeById(id);
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