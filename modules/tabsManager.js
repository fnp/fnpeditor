rng.modules.tabsManager = function(sandbox) {

    var $ = sandbox.$;
    
    var view = $(sandbox.getTemplate('main')());
    
    var tabContent = {};
    
    function selectTab(slug) {
        var tabBar = view.find('#rng-tabsManager-tabBar');
        
        var prevActive = tabBar.find('li.active');
        var prevSlug;
        if(prevActive.length)
            prevSlug = prevActive.find('a').attr('href').substr(1);
        
        if(prevSlug == slug)
            return;
        if(prevSlug)
            sandbox.publish('leaving', prevSlug);
        
        tabBar.find('li').removeClass('active');
        tabBar.find('a[href=#' + slug + ']').parent().addClass('active');
        
        if(prevSlug)
            tabContent[prevSlug].detach();
        tabContent[slug].appendTo(view.find('#rng-tabsManager-content'));
    }
       
    
    view.on('click', 'li a', function(e) {
        selectTab($(e.target).attr('href').substr(1));
    });
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        
        getView: function() {
            return view;
        },
        
        addTab: function(title, slug, contentView) {
            tabContent[slug] = contentView;
            view.find('#rng-tabsManager-tabBar').append(sandbox.getTemplate('tabHandle')({title: title, slug: slug}));
            if(_.values(tabContent).length === 1)
                selectTab(slug);
        }
    }

};