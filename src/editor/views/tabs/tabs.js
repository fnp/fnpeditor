define([
'libs/jquery',
'libs/text!./templates/main.html',
'libs/text!./templates/handle.html',
'libs/underscore',
'libs/backbone'
], function($, mainTemplate, handleTemplate, _, Backbone) {
    'use strict';
    
    var View = Backbone.View.extend({
        className: 'rng-view-tabs',
        
        events: {
            'click .rng-view-tabs-tabBar a, .rng-view-tabs-tabBar i': '_onTabTitleClicked'
        },
        
        initialize: function(options) {
            this.options = options || {};
            this.template = _.template(mainTemplate);
            this.handleTemplate = _.template(handleTemplate);
            this.contents = {};
            this.selectedTab = null;
        },
        
        render: function() {
            this.$el.html(this.template());
            this.nodes = {
                tabBar: this.$('.rng-view-tabs-tabBar'),
                content: this.$('.rng-view-tabs-content')
            };
            
            if(this.options.stacked) {
                this.nodes.tabBar.addClass('nav-stacked nav-pills').removeClass('nav-tabs');
            }
            if(this.options.position === 'right') {
                this.$el.addClass('tabs-right');
                this.nodes.content.addClass('tab-content');
            }
            return this;
        },
        
        addTab: function(title, slug, content, tutorial) {
            if(this.contents[slug]) {
                this.contents[slug].detach();
            }
            this.contents[slug] = content;
            
            var text = (typeof title === 'string') ? title : (title.text || '');
            var icon = title.icon || null;
            
            if(!this.tabExists(slug)) {
                this.nodes.tabBar.append(this.handleTemplate({text: text, icon: icon, slug: slug, tutorial: tutorial}));
            }
            if(!this.selectedTab) {
                this.selectTab(slug);
            }
        },
        
        selectTab: function(slug) {
            if(slug !== this.selectedTab && this.contents[slug]) {
                this.trigger('leaving', this.selectedTab);
                
                if(this.selectedTab) {
                    var toDetach = this.contents[this.selectedTab];
                    if(toDetach.onHide) {
                        toDetach.onHide();
                    }
                    toDetach.detach();
                }
                this.nodes.content.append(this.contents[slug]);
                if(this.contents[slug].onShow) {
                    this.contents[slug].onShow();
                }
                this.nodes.tabBar.find('.active').removeClass('active');
                this.nodes.tabBar.find('a[href="#'+slug+'"]').parent().addClass('active');
                
                var prevSlug = this.selectedTab;
                this.selectedTab = slug;
                this.trigger('tabSelected', {slug: slug, prevSlug: prevSlug});
            }
        },
        
        getAsView: function() {
            return this.$el;
        },
        
        getCurrentSlug: function() {
            return this.selectedTab;
        },
        
        tabExists: function(slug) {
            return this.nodes.tabBar.find('a[href="#'+ slug + '"]').length > 0;
        },
        
        /* Events */
        
        _onTabTitleClicked: function(e) {
            e.preventDefault();
            var target = $(e.target);
            if(target.is('i')) {
                target = target.parent();
            }
            var slug = target.attr('href').substr(1);
            this.selectTab(slug);
        }
    });

    
    return {
        View: View
    };
    

});