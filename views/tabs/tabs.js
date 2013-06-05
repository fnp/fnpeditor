define([
'libs/text!./templates/main.html',
'libs/text!./templates/handle.html',
'libs/underscore-min',
'libs/backbone-min',
], function(mainTemplate, handleTemplate, _, Backbone) {
    'use strict';
    
    var View = Backbone.View.extend({
        className: 'rng-view-tabs',
        
        events: {
            'click ul a, i': '_onTabTitleClicked'
        },
        
        initialize: function(options) {
            this.options = options || {};
            this.template = _.template(mainTemplate),
            this.handleTemplate = _.template(handleTemplate);
            this.contents = {};
            this.selectedTab = null;
        },
        
        render: function() {
            this.$el.html(this.template());
            this.nodes = {
                tabBar: this.$('.rng-view-tabs-tabBar'),
                content: this.$('.rng-view-tabs-content')
            }
            
            if(this.options.stacked) {
                this.nodes.tabBar.addClass('nav-stacked nav-pills');
            }
            return this;
        },
        
        addTab: function(title, slug, content) {
            if(this.contents[slug])
                return false;
            this.contents[slug] = content;
            
            var text = (typeof title === 'string') ? title : (title.text || '');
            var icon = title.icon || null;
            
            this.nodes.tabBar.append(this.handleTemplate({text: text, icon: icon, slug: slug}));
            if(!this.selectedTab)
                this.selectTab(slug);
        },
        
        selectTab: function(slug) {
            if(slug !== this.selectedTab && this.contents[slug]) {
                this.trigger('leaving', this.selectedTab);
                
                if(this.selectedTab)
                    this.contents[this.selectedTab].detach();
                this.nodes.content.append(this.contents[slug]);
                this.nodes.tabBar.find('.active').removeClass('active');
                this.nodes.tabBar.find('a[href="#'+slug+'"]').parent().addClass('active');
                
                this.selectedTab = slug;
                this.trigger('tabSelected', slug);
            }
        },
        
        getAsView: function() {
            return this.$el;
        },
        
        /* Events */
        
        _onTabTitleClicked: function(e) {
            e.preventDefault();
            var target = $(e.target);
            if(target.is('i'))
                target = target.parent();
            var slug = target.attr('href').substr(1);
            this.selectTab(slug);
        }
    });

    
    return {
        View: View
    }
    

});