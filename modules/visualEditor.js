rng.modules.visualEditor = function(sandbox) {
    var transformations = rng.modules.visualEditor.transformations;

    var view = {
        node: $(sandbox.getTemplate('main')()),
        currentNode: null,
        setup: function() {
            var view = this;

            this.node.find('#rng-visualEditor-content').on('keyup', function() {
                isDirty = true;
            });
            
            this.node.find('#rng-visualEditor-meta').on('keyup', function() {
                isDirty = true;
            });

            this.node.on('mouseover', '[wlxml-tag]', function(e) { mediator.nodeHovered($(e.target));});
            this.node.on('mouseout', '[wlxml-tag]', function(e) { mediator.nodeBlured($(e.target));});
            this.node.on('click', '[wlxml-tag]', function(e) {
                console.log('clicked node type: '+e.target.nodeType);
                view._markSelected($(e.target));
            });

            this.node.on('keyup', '#rng-visualEditor-contentWrapper', function(e) {
                var anchor = $(window.getSelection().anchorNode);
                if(anchor[0].nodeType === Node.TEXT_NODE)
                    anchor = anchor.parent();
                if(!anchor.is('[wlxml-tag]'))
                    return;
                view._markSelected(anchor);
            });
            
            this.node.on('keydown', '#rng-visualEditor-contentWrapper', function(e) {
                if(e.which === 13) { 
                    e.preventDefault();
                    view.insertNewNode(null, null);
                }
            });
            
            
            var metaTable = this.metaTable = this.node.find('#rng-visualEditor-meta table');
            
            this.node.find('.rng-visualEditor-metaAddBtn').click(function() {
                var newRow = view._addMetaRow('', '');
                $(newRow.find('td div')[0]).focus();
                isDirty = true;
            });
            
            this.metaTable.on('click', '.rng-visualEditor-metaRemoveBtn', function(e) {
                $(e.target).closest('tr').remove();
                isDirty = true;
            });
            
            this.metaTable.on('keydown', '[contenteditable]', function(e) {
                console.log(e.which);
                if(e.which === 13) { 
                    if($(document.activeElement).hasClass('rng-visualEditor-metaItemKey')) {
                        metaTable.find('.rng-visualEditor-metaItemValue').focus();
                    } else {
                        var input = $('<input>');
                        input.appendTo('body').focus()
                        view.node.find('.rng-visualEditor-metaAddBtn').focus();
                        input.remove();
                    }
                    e.preventDefault();
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
            observer.observe(this.node.find('#rng-visualEditor-contentWrapper')[0], config);
            
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
            if(anchor[0].nodeType === Node.TEXT_NODE)
                anchor = anchor.parent();
            if(anchor.text() === '') {
                var todel = anchor;
                anchor = anchor.parent();
                todel.remove();
            }
            var newNode = this._createNode(wlxmlTag || anchor.attr('wlxml-tag'), wlxmlClass || anchor.attr('wlxml-class'));
            anchor.after(newNode);
            mediator.nodeCreated(newNode);
            isDirty = true;
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
                newNode.text(core);
                $(node).replaceWith(newNode);
                newNode.before(prefix);
                newNode.after(suffix);
                mediator.nodeCreated(newNode);
                isDirty = true;
            }
        },
        getMetaData: function() {
            var toret = {};
            this.metaTable.find('tr').each(function() {
                var tr = $(this);
                var inputs = $(this).find('td [contenteditable]');
                var key = $(inputs[0]).text();
                var value = $(inputs[1]).text();
                toret[key] = value;
            });
            console.log(toret);
            return toret;
        },
        setMetaData: function(metadata) {
            var view = this;
            this.metaTable.find('tr').remove();
            _.each(_.keys(metadata), function(key) {    
                view._addMetaRow(key, metadata[key]);
            });
        },
        setBody: function(HTMLTree) {
            this.node.find('#rng-visualEditor-content').html(HTMLTree);
        },
        getBody: function() {
            return this.node.find('#rng-visualEditor-content').html();
        }, 
        _markSelected: function(node) {
            this.dimNode(node);
            
            this.node.find('.rng-current').removeClass('rng-current');
            
            node.addClass('rng-current');

            this.currentNode = node;
            mediator.nodeSelected(node);
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
                node.addClass('rng-hover');
                var label = node.attr('wlxml-tag');
                if(node.attr('wlxml-class'))
                    label += ' / ' + node.attr('wlxml-class');
                var tag = $('<div>').addClass('rng-visualEditor-nodeHoverTag').text(label);
                node.append(tag);
            }
        },
        dimNode: function(node) {
            if(!this.gridToggled) {
                node.removeClass('rng-hover');
                node.find('.rng-visualEditor-nodeHoverTag').remove();
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
        _addMetaRow: function(key, value) {
            var newRow = $(sandbox.getTemplate('metaItem')({key: key || '', value: value || ''}));
            newRow.appendTo(this.metaTable);
            return newRow;
        },
        toggleGrid: function(toggle) {
            this.node.find('[wlxml-tag]').toggleClass('rng-hover', toggle);
            this.gridToggled = toggle;
        },
        toggleTags: function(toggle) {
        
        }
    };
    
    
    var sideBarView = {
        node: view.node.find('#rng-visualEditor-sidebar'),
        setup: function() {
            var view = this;
            this.node.find('#rng-visualEditor-sidebarButtons a').click(function(e) {
                e.preventDefault();
                var target = $(e.currentTarget);
                if(!target.attr('data-content-id'))
                    return;
                view.selectTab(target.attr('data-content-id'));
            });
            view.selectTab('rng-visualEditor-edit');
            
            view.node.on('change', '.rng-visualEditor-editPaneNodeForm select', function(e) {
                var target = $(e.target);
                var attr = target.attr('id').split('-')[2].split('editPane')[1].substr(0,3) === 'Tag' ? 'tag' : 'class';
                mediator.getCurrentNode().attr('wlxml-'+attr, target.val());
                isDirty = true;
            });
                       
            view.node.on('click', '.rng-visualEditor-editPaneSurrouding a', function(e) {
                var target = $(e.target);
                mediator.nodeDimmedById(target.attr('data-id'));
                mediator.nodeSelectedById(target.attr('data-id'));
            });
            
            view.node.on('mouseenter', '.rng-visualEditor-editPaneSurrouding a', function(e) {
                var target = $(e.target);
                mediator.nodeHighlightedById(target.attr('data-id')); 
            });
            view.node.on('mouseleave', '.rng-visualEditor-editPaneSurrouding a', function(e) {
                var target = $(e.target);
                mediator.nodeDimmedById(target.attr('data-id')); 
            });
        },
        selectTab: function(id) {
           this.node.find('.rng-visualEditor-sidebarContentItem').hide();
           this.node.find('#'+id).show();
           this.node.find('#rng-visualEditor-sidebarButtons li').removeClass('active');
           this.node.find('#rng-visualEditor-sidebarButtons li a[data-content-id=' + id + ']').parent().addClass('active');
        
        },
        updateEditPane: function(node) {
            var pane = this.node.find('#rng-visualEditor-edit');
            pane.html( $(sandbox.getTemplate('editPane')({tag: node.attr('wlxml-tag'), klass: node.attr('wlxml-class')})));
            
            var parent = node.parent('[wlxml-tag]').length ? {
                repr: node.parent().attr('wlxml-tag') + ' / ' + (node.parent().attr('wlxml-class') || '[[no class]]'),
                id: node.parent().attr('id')
            } : undefined;
            var children = [];
            node.children('[wlxml-tag]').each(function() {
                var child = $(this);
                children.push({repr: child.attr('wlxml-tag') + ' / ' + (child.attr('wlxml-class') || '[[no class]]'), id: child.attr('id')});
            });
            var naviTemplate = sandbox.getTemplate('editPaneNavigation')({parent: parent, children: children});
            pane.find('.rng-visualEditor-editPaneSurrouding > div').html($(naviTemplate));
        },
        highlightNode: function(id) {
            var pane = this.node.find('#rng-visualEditor-edit');
            pane.find('a[data-id="'+id+'"]').addClass('rng-hover');
        },
        dimNode: function(id) {
            var pane = this.node.find('#rng-visualEditor-edit');
            pane.find('a[data-id="' +id+'"]').removeClass('rng-hover');
        }
    }
    
    var toolbarView = {
        node: view.node.find('#rng-visualEditor-toolbar'),
        setup: function() {
            var view = this;
            
            view.node.find('button').click(function(e) {
                var btn = $(e.currentTarget);
                if(btn.attr('data-btn-type') === 'toggle') {
                    btn.toggleClass('active')
                    mediator.toolbarButtonToggled(btn.attr('data-btn'), btn.hasClass('active'));
                }
                if(btn.attr('data-btn-type') === 'cmd') {
                    mediator.toolbarButtonCmd(btn.attr('data-btn'));
                }
            });
        },
        getOption: function(option) {
            return this.node.find('.rng-visualEditor-toolbarOption[data-option=' + option +']').val();
        }
    }
    
    var statusBarView = {
        node: view.node.find('#rng-visualEditor-statusbar'),
        setup: function() {
            var view = this;
            view.node.on('mouseenter', 'a', function(e) {
                var target = $(e.target);
                mediator.nodeHighlightedById(target.attr('data-id')); 
            });
            view.node.on('mouseleave', 'a', function(e) {
                var target = $(e.target);
                mediator.nodeDimmedById(target.attr('data-id')); 
            });
            view.node.on('click', 'a', function(e) {
                e.preventDefault();
                mediator.nodeSelectedById($(e.target).attr('data-id'));
            });
        },
        
        showNode: function(node) {
            this.node.empty();
            this.node.html(sandbox.getTemplate('statusBarNodeDisplay')({node: node, parents: node.parents('[wlxml-tag]')}));
            //node.parents('[wlxml-tag]')
        },
        
        highlightNode: function(id) {
            this.node.find('a[data-id="'+id+'"]').addClass('rng-hover');
        },
        dimNode: function(id) {
            this.node.find('a[data-id="' +id+'"]').removeClass('rng-hover');
        }
    }
    
    view.setup();
    sideBarView.setup();
    toolbarView.setup();
    statusBarView.setup();
    
    var mediator = {
        getCurrentNode: function() {
            return view.currentNode;
        },
        nodeCreated: function(node) {
            view.selectNode(node);
        },
        nodeSelected: function(node) {
            sideBarView.updateEditPane(node);
            statusBarView.showNode(node);
        },
        nodeSelectedById: function(id) {
            view.selectNodeById(id);
        },
        nodeHighlightedById: function(id) {
            view.highlightNodeById(id);
        },
        nodeDimmedById: function(id) {
            view.dimNodeById(id);
        },
        toolbarButtonToggled: function(btn, toggle) {
            if(btn === 'grid')
                view.toggleGrid(toggle);
            if(btn === 'tags')
                view.toggleTags(toggle);
        },
        toolbarButtonCmd: function(btn) {
            if(btn === 'new-node') {
                if(window.getSelection().isCollapsed)
                    view.insertNewNode(toolbarView.getOption('newTag-tag'), toolbarView.getOption('newTag-class'));
                else {
                    this.wrapWithNodeRequest(toolbarView.getOption('newTag-tag'), toolbarView.getOption('newTag-class'));
                }
                    
                    
            }
        },
        nodeHovered: function(node) {
            view.highlightNode(node);
            sideBarView.highlightNode(node.attr('id'));
            statusBarView.highlightNode(node.attr('id'));
        },
        nodeBlured: function(node) {
            view.dimNode(node);
            sideBarView.dimNode(node.attr('id'));
            statusBarView.dimNode(node.attr('id'));
        },
        wrapWithNodeRequest: function(wlxmlTag, wlxmlClass) {
            view.wrapSelectionWithNewNode(wlxmlTag, wlxmlClass);
        }
        
    }
    
    var isDirty = false;
    var wasShownAlready = false;
    
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        getView: function() {
            return view.node;
        },
        setDocument: function(xml) {
            var transformed = transformations.fromXML.getDocumentDescription(xml);
            view.setBody(transformed.HTMLTree);
            view.setMetaData(transformed.metadata);
            isDirty = false;
        },
        getDocument: function() {
            return transformations.toXML.getXML({HTMLTree: view.getBody(), metadata: view.getMetaData()});
        },
        isDirty: function() {
            return isDirty;
        },
        setDirty: function(dirty) {
            isDirty = dirty;
        },
        onShowed: function() {
            if(!wasShownAlready) {
                wasShownAlready = true;
                view.selectFirstNode();
            }
        }
    
    }
};